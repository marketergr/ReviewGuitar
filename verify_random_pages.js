const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

// Load product catalog for ASIN verification
const productsPath = path.join(rootDir, 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const validASINs = new Set(products.map(p => {
    // Extract ASIN from amazonLink
    const m = p.amazonLink.match(/\/dp\/([A-Z0-9]{10})/);
    return m ? m[1] : null;
}).filter(Boolean));

// 1. Gather all HTML files
function collectFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'GSC') continue;
        
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(fullPath));
        } else if (entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

const allHtmlFiles = collectFiles(rootDir);
console.log(`Found ${allHtmlFiles.length} total HTML pages in the repository.`);

// Group files by category/directory to ensure random sampling selects across silos
const groups = {};
for (const file of allHtmlFiles) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    let groupKey = 'root';
    if (relPath.startsWith('pages/')) {
        // pages/acoustic_beginner_*.html -> acoustic/beginner
        const parts = relPath.substring(6).split('_');
        if (parts.length >= 2) {
            groupKey = `pages/${parts[0]}/${parts[1]}`;
        } else {
            groupKey = 'pages/other';
        }
    } else if (relPath.startsWith('collections/')) {
        const parts = relPath.substring(12).split('/');
        if (parts.length >= 2) {
            groupKey = `collections/${parts[0]}`;
        } else {
            groupKey = 'collections/other';
        }
    }
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(file);
}

console.log(`Grouped pages into ${Object.keys(groups).length} categories/silos.`);

// 2. Select a random sample of pages (at least one from each non-empty group, up to 15 total)
const samplePages = [];
const groupKeys = Object.keys(groups).sort();
const rng = () => Math.random(); // standard random

// Try to grab 1 random page from each group
for (const key of groupKeys) {
    const list = groups[key];
    if (list.length > 0) {
        const randIndex = Math.floor(rng() * list.length);
        samplePages.push(list[randIndex]);
    }
}

// If we want exactly 15 pages and have fewer, or if we want to cap it
const finalSample = samplePages.slice(0, 15);
console.log(`Selected ${finalSample.length} random pages for deep validation:`);
finalSample.forEach(f => console.log(` - ${path.relative(rootDir, f).replace(/\\/g, '/')}`));

// 3. Deep Validation function
function validatePage(filePath) {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const logs = [];
    let isValid = true;

    // Check 1: Title Tag
    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
    if (!titleMatch) {
        logs.push('ERROR: Missing <title> tag.');
        isValid = false;
    } else if (!titleMatch[1].trim()) {
        logs.push('ERROR: Empty <title> tag.');
        isValid = false;
    } else {
        logs.push(`INFO: Title is "${titleMatch[1].trim()}"`);
    }

    // Check 2: Meta Description
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) || 
                      content.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
    if (!descMatch) {
        logs.push('ERROR: Missing meta description.');
        isValid = false;
    } else if (!descMatch[1].trim()) {
        logs.push('ERROR: Empty meta description.');
        isValid = false;
    } else {
        logs.push(`INFO: Meta description is "${descMatch[1].trim()}"`);
    }

    // Check 3: Canonical Link
    const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
    if (!canonicalMatch) {
        logs.push('ERROR: Missing canonical link.');
        isValid = false;
    } else {
        const href = canonicalMatch[1];
        logs.push(`INFO: Canonical URL is "${href}"`);
        if (href.endsWith('.html')) {
            logs.push(`ERROR: Canonical URL "${href}" contains .html extension (Vercel cleanUrls:true requires clean URLs).`);
            isValid = false;
        }
        if (!href.startsWith('https://reviewsguitar.com')) {
            logs.push(`ERROR: Canonical URL "${href}" does not use the production domain https://reviewsguitar.com.`);
            isValid = false;
        }
    }

    // Check 4: Internal Links
    const hrefRegex = /href="([^"]+)"/g;
    let match;
    let internalLinkCount = 0;
    while ((match = hrefRegex.exec(content)) !== null) {
        let link = match[1];
        if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('#') || link.startsWith('javascript:')) {
            continue;
        }
        internalLinkCount++;
        // Resolve path relative to the file
        let resolvedLink = link;
        if (link.startsWith('/')) {
            resolvedLink = path.join(rootDir, link.substring(1));
        } else {
            const fileDir = path.dirname(filePath);
            resolvedLink = path.resolve(fileDir, link);
        }
        // strip query params or hashes
        resolvedLink = resolvedLink.split('?')[0].split('#')[0];
        
        // Check if file exists
        let exists = fs.existsSync(resolvedLink);
        if (!exists) {
            // Check with .html or index.html for clean URLs
            if (fs.existsSync(resolvedLink + '.html')) exists = true;
            else if (fs.existsSync(path.join(resolvedLink, 'index.html'))) exists = true;
        }

        if (!exists) {
            logs.push(`ERROR: Broken internal link: "${link}" (Resolves to non-existent path: "${resolvedLink}")`);
            isValid = false;
        }
    }
    logs.push(`INFO: Checked ${internalLinkCount} internal links.`);

    // Check 5: Amazon Affiliate Links
    const amzRegex = /href="([^"]*amazon\.[a-z.]+\/[^"]*)"/gi;
    let amzMatch;
    let amazonLinkCount = 0;
    while ((amzMatch = amzRegex.exec(content)) !== null) {
        amazonLinkCount++;
        const url = amzMatch[1].replace(/&amp;/g, '&');
        
        // Verify tracking tag
        if (!url.includes('tag=reviewsguitar-20')) {
            logs.push(`ERROR: Amazon link missing affiliate tag: "${url}"`);
            isValid = false;
        }
        
        // Verify ASIN is valid in products.json
        const asinM = url.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinM) {
            const asin = asinM[1];
            if (!validASINs.has(asin)) {
                logs.push(`WARNING: Amazon link contains ASIN "${asin}" which is not defined in products.json: "${url}"`);
            }
        } else {
            logs.push(`WARNING: Amazon link does not contain a standard /dp/ASIN format: "${url}"`);
        }
    }
    logs.push(`INFO: Checked ${amazonLinkCount} Amazon affiliate links.`);

    // Check 6: Images
    const imgRegex = /<img\s+[^>]*src=["']([^"']+)["']/gi;
    let imgMatch;
    let imageCount = 0;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
        imageCount++;
        const src = imgMatch[1];
        if (src.startsWith('http') || src.startsWith('data:')) continue; // Skip external/base64
        
        const imgPath = path.join(rootDir, src.startsWith('/') ? src.substring(1) : src);
        if (!fs.existsSync(imgPath)) {
            logs.push(`ERROR: Broken image src: "${src}" (File not found on disk at: "${imgPath}")`);
            isValid = false;
        }
    }
    logs.push(`INFO: Checked ${imageCount} local images.`);

    return { relPath, isValid, logs };
}

// 4. Run Deep Validation on all sampled pages
const results = [];
let overallValid = true;

for (const file of finalSample) {
    const result = validatePage(file);
    results.push(result);
    if (!result.isValid) overallValid = false;
}

// 5. Generate Report and Log to file
const reportDir = path.join(rootDir, 'audit');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

const jsonLogPath = path.join(reportDir, 'random-pages-test-log.json');
fs.writeFileSync(jsonLogPath, JSON.stringify(results, null, 2), 'utf8');

let mdReport = `# Random Pages Deep Validation Report\n\n`;
mdReport += `Generated on: ${new Date().toISOString()}\n`;
mdReport += `Overall Status: ${overallValid ? '🟢 PASS' : '🔴 FAIL'}\n\n`;
mdReport += `This report lists the deep validation results of ${results.length} randomly selected pages representing all major silos and categories.\n\n`;

mdReport += `## Summary of Tested Pages\n\n`;
mdReport += `| Page | Status | Issues | \n|---|---|---|\n`;
for (const res of results) {
    const errorCount = res.logs.filter(l => l.startsWith('ERROR:')).length;
    const warningCount = res.logs.filter(l => l.startsWith('WARNING:')).length;
    const status = res.isValid ? '🟢 Pass' : '🔴 Fail';
    mdReport += `| [${res.relPath}](file:///${path.join(rootDir, res.relPath).replace(/\\/g, '/')}) | ${status} | ${errorCount} Errors, ${warningCount} Warnings |\n`;
}

mdReport += `\n## Detailed Test Logs\n\n`;
for (const res of results) {
    mdReport += `### Page: ${res.relPath}\n\n`;
    mdReport += `**Status:** ${res.isValid ? '🟢 PASS' : '🔴 FAIL'}\n\n`;
    mdReport += `\`\`\`text\n`;
    mdReport += res.logs.join('\n') + `\n`;
    mdReport += `\`\`\`\n\n`;
}

const mdReportPath = path.join(reportDir, 'random-pages-test-report.md');
fs.writeFileSync(mdReportPath, mdReport, 'utf8');

console.log('\n--- Deep Validation Completed ---');
console.log(`Overall Status: ${overallValid ? 'PASS' : 'FAIL'}`);
console.log(`Logs saved to: audit/random-pages-test-log.json`);
console.log(`Markdown Report saved to: audit/random-pages-test-report.md`);

if (!overallValid) {
    console.log('\nAnomalies detected! Please review the logs to fix issues.');
    process.exit(1);
} else {
    console.log('\nAll checked pages passed validation successfully!');
}

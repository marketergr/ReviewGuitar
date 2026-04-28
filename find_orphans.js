const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const allHtmlFiles = new Set();
const linkMap = new Map(); // file -> Set of links

// 1. Gather all HTML files
function collectFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'GSC') continue;
        
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectFiles(fullPath);
        } else if (entry.name.endsWith('.html')) {
            // Store as relative path from root with forward slashes
            const relPath = '/' + path.relative(rootDir, fullPath).replace(/\\/g, '/');
            allHtmlFiles.add(relPath);
        }
    }
}

collectFiles(rootDir);

// 2. Parse all links in all HTML files
const hrefRegex = /href="([^"]+)"/g;

for (const file of allHtmlFiles) {
    const fullPath = path.join(rootDir, file.substring(1));
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const links = new Set();
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
        let link = match[1];
        // ignore external links and hashes
        if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('#') || link.startsWith('javascript:')) {
            continue;
        }
        
        // resolve relative links to absolute root-based links
        let resolvedLink = link;
        if (link.startsWith('/')) {
            // Already root-relative
            resolvedLink = link;
        } else {
            // Relative to current file's directory
            const fileDir = path.dirname(file); // e.g. /collections/acoustic
            resolvedLink = path.posix.join(fileDir, link);
        }
        
        // strip query params or hashes from local link
        resolvedLink = resolvedLink.split('?')[0].split('#')[0];
        
        // if link doesn't end in .html but has no extension, assume it might be a directory -> add index.html
        if (!path.extname(resolvedLink) && resolvedLink !== '/') {
            // In a static site, /collections/acoustic usually means /collections/acoustic/index.html
            // We'll just check both or leave it as is and check during validation
        }
        
        links.add(resolvedLink);
    }
    linkMap.set(file, links);
}

// 3. Find Dead Links (links to non-existent files)
const deadLinks = [];
for (const [file, links] of linkMap.entries()) {
    for (let link of links) {
        // Exclude root / which is index.html
        if (link === '/') link = '/index.html';
        
        // Exclude /go/ links (handled by Vercel)
        if (link.startsWith('/go/')) continue;
        
        // If it's a directory link, append /index.html for checking
        if (!link.endsWith('.html')) {
            if (!allHtmlFiles.has(link) && allHtmlFiles.has(link + '/index.html')) {
                link = link + '/index.html';
            } else if (!allHtmlFiles.has(link) && allHtmlFiles.has(link + '.html')) {
                link = link + '.html'; // Vercel clean urls
            }
        }
        
        if (!allHtmlFiles.has(link)) {
            deadLinks.push({ source: file, target: link });
        }
    }
}

// 4. Find Orphan Pages (pages that no other page links to)
const linkedTo = new Set();
for (const links of linkMap.values()) {
    for (let link of links) {
         if (link === '/') link = '/index.html';
         // Resolve clean urls
         if (!link.endsWith('.html')) {
             if (allHtmlFiles.has(link + '/index.html')) link = link + '/index.html';
             else if (allHtmlFiles.has(link + '.html')) link = link + '.html';
         }
         linkedTo.add(link);
    }
}

const orphanPages = [];
for (const file of allHtmlFiles) {
    if (file === '/index.html') continue; // Entry point
    
    // Check if it's in linkedTo
    let isLinked = linkedTo.has(file);
    
    if (!isLinked) {
        // Also check if they linked to it without .html (Vercel clean urls)
        const cleanUrl = file.replace(/\.html$/, '');
        if (linkedTo.has(cleanUrl)) {
            isLinked = true;
        }
        // Also check if it's an index.html and they linked to the directory
        if (file.endsWith('/index.html')) {
            const dirUrl = file.replace(/\/index\.html$/, '');
            if (linkedTo.has(dirUrl) || linkedTo.has(dirUrl + '/')) {
                isLinked = true;
            }
        }
    }
    
    if (!isLinked) {
        orphanPages.push(file);
    }
}

console.log('--- Dead Links ---');
if (deadLinks.length === 0) console.log('None found!');
else {
    const grouped = {};
    deadLinks.forEach(d => {
        if (!grouped[d.target]) grouped[d.target] = [];
        grouped[d.target].push(d.source);
    });
    for (const [target, sources] of Object.entries(grouped)) {
        console.log(`\nDead Link: ${target}`);
        console.log(`Found in ${sources.length} files. Examples: ${sources.slice(0, 3).join(', ')}`);
    }
}

console.log('\n--- Orphan Pages ---');
if (orphanPages.length === 0) console.log('None found!');
else {
    orphanPages.forEach(p => console.log(p));
}

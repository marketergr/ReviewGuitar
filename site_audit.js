const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));

const errors = [];
const verified = [];

function checkLink(filePath, link) {
    if (link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:')) return;
    
    // Normalize link
    let targetPath = link;
    if (link.startsWith('/')) {
        targetPath = path.join(rootDir, link);
    } else {
        targetPath = path.join(path.dirname(filePath), link);
    }

    // Check if it's a rewrite source
    if (vercelConfig.rewrites) {
        const rewrite = vercelConfig.rewrites.find(r => r.source === link || (link.startsWith('/') && r.source === link) || (!link.startsWith('/') && r.source === '/' + path.relative(rootDir, targetPath).replace(/\\/g, '/')));
        if (rewrite) return; // Verified by rewrite
    }

    // Check filesystem
    const potentialPaths = [
        targetPath,
        targetPath + '.html',
        path.join(targetPath, 'index.html')
    ];

    let found = false;
    for (const p of potentialPaths) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            found = true;
            break;
        }
    }

    if (!found) {
        errors.push({
            file: path.relative(rootDir, filePath),
            link: link,
            resolved: targetPath
        });
    } else {
        verified.push(link);
    }
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'GSC') continue;
        
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.html')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const linkRegex = /href=["']([^"']+)["']/g;
            let match;
            while ((match = linkRegex.exec(content)) !== null) {
                checkLink(fullPath, match[1]);
            }
        }
    }
}

console.log('Starting Site Audit...');
processDir(rootDir);

console.log('\n--- AUDIT REPORT ---');
console.log(`Total Links Checked: ${verified.length + errors.length}`);
console.log(`Verified Links: ${verified.length}`);
console.log(`Potential Broken Links: ${errors.length}`);

if (errors.length > 0) {
    console.log('\n--- BROKEN LINKS ---');
    errors.forEach(e => {
        console.log(`File: ${e.file} -> Link: ${e.link}`);
    });
}

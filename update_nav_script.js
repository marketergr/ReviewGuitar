const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Match the inline nav script block (handles whitespace/indentation variations)
const OLD_SCRIPT_RE = /<script>\s*document\.addEventListener\('DOMContentLoaded'[\s\S]*?\.mobile-menu-toggle[\s\S]*?<\/script>/;

const NEW_SCRIPT = `    <script src="/js/nav.js"></script>`;

function getAllHtmlFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules if present
            if (entry.name === 'node_modules') continue;
            getAllHtmlFiles(fullPath, files);
        } else if (entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    return files;
}

const htmlFiles = getAllHtmlFiles(ROOT);
let updated = 0;
let skipped = 0;

for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (OLD_SCRIPT_RE.test(content)) {
        const newContent = content.replace(OLD_SCRIPT_RE, NEW_SCRIPT);
        fs.writeFileSync(file, newContent, 'utf8');
        updated++;
        console.log(`Updated: ${path.relative(ROOT, file)}`);
    } else {
        skipped++;
        console.log(`Skipped: ${path.relative(ROOT, file)}`);
    }
}

console.log(`\nDone. Updated: ${updated}, Skipped (no match): ${skipped}`);

const fs = require('fs');
const path = require('path');
const replacements = require('./asin_replacements.json');

const deadAsins = Object.keys(replacements).filter(k => replacements[k].newAsin === null);

function cleanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (['node_modules', '.git', 'images', 'css'].includes(file)) continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            cleanDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const asin of deadAsins) {
                // Remove Quick Link <li>
                const liRegex = new RegExp('<li[^>]*>[\\s\\S]*?' + asin + '[\\s\\S]*?</li>', 'g');
                if (liRegex.test(content)) {
                    content = content.replace(liRegex, '');
                    modified = true;
                }
                
                // Remove product-row <div class="product-row">...</div>
                // Since there can be multiple, we match <div class="product-row"> ... until the closing </div> of that row.
                // An easier way is just matching the block if it contains the ASIN.
                const rows = content.split('<div class="product-row">');
                const newRows = rows.filter(row => !row.includes(asin));
                if (newRows.length !== rows.length) {
                    content = newRows.join('<div class="product-row">');
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Cleaned dead blocks from ' + fullPath);
            }
        }
    }
}

cleanDir('.');
console.log('Done cleaning dead ASIN blocks.');

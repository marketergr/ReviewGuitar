const fs = require('fs');
const path = require('path');

const asinMap = JSON.parse(fs.readFileSync('asin_mapping.json', 'utf8'));

// Convert product name to a URL-friendly slug
function slugify(text) {
    if (text === 'Unknown') return 'guitar-gear'; // fallback for unknown
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'css' && file !== 'images' && file !== '.git' && file !== 'GSC') {
                processDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Search for /go/ASIN
            const goRegex = /href="\/go\/([A-Z0-9]{10})"/g;
            let modified = false;
            
            content = content.replace(goRegex, (match, asin) => {
                const name = asinMap[asin];
                if (name) {
                    const slug = slugify(name);
                    modified = true;
                    return `href="/go/${slug}"`;
                }
                return match; // If not in map, leave it (though all 35 should be)
            });
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated dynamic slugs in', fullPath);
            }
        }
    }
}

processDir(process.cwd());
console.log('\n--- Dynamic Cloaking Applied ---');

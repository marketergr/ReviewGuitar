const fs = require('fs');
const path = require('path');

const ASINs = new Set();

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
            
            const amazonRegex = /href="https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})[^"]*"/g;
            let modified = false;
            
            content = content.replace(amazonRegex, (match, asin) => {
                ASINs.add(asin);
                modified = true;
                return `href="/go/${asin}"`;
            });
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated Amazon links in', fullPath);
            }
        }
    }
}

processDir(process.cwd());
console.log('\n--- Extraction Complete ---');
console.log(`Found ${ASINs.size} unique ASINs.`);
// Write them to a file for checking if needed
fs.writeFileSync('unique_asins.txt', Array.from(ASINs).join('\n'));

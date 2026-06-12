const fs = require('fs');
const path = require('path');

const replacements = JSON.parse(fs.readFileSync('asin_replacements.json', 'utf8'));
const deadAsins = Object.keys(replacements).filter(k => replacements[k].newAsin === null);

let foundDeadCount = 0;
let filesChecked = 0;

function checkDeadAsinsInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (['node_modules', '.git', 'images', 'css'].includes(file)) continue;
        const fullPath = path.join(dir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
            checkDeadAsinsInDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            filesChecked++;
            const content = fs.readFileSync(fullPath, 'utf8');
            for (const asin of deadAsins) {
                if (content.includes(asin)) {
                    console.log(`❌ Found dead ASIN ${asin} in ${fullPath}`);
                    foundDeadCount++;
                }
            }
        }
    }
}

checkDeadAsinsInDir('.');
console.log(`\nChecked ${filesChecked} HTML files for dead ASINs.`);
if (foundDeadCount === 0) {
    console.log('✅ PERFECT! No dead ASINs found.');
} else {
    console.log(`❌ FOUND ${foundDeadCount} DEAD ASINS!`);
}

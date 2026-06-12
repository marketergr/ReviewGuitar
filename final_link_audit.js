const fs = require('fs');
const path = require('path');

let brokenLinksCount = 0;
let checkedLinksCount = 0;
let filesChecked = 0;

function checkLinksInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (['node_modules', '.git', 'images', 'css'].includes(file)) continue;
        const fullPath = path.join(dir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
            checkLinksInDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            filesChecked++;
            const content = fs.readFileSync(fullPath, 'utf8');
            const regex = /href="(\/[^"]+)"/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                checkedLinksCount++;
                let link = match[1].split('#')[0];
                
                // Exclude external-like or special links
                if (link.startsWith('//') || link.startsWith('/go/')) continue;
                
                // Vercel rewrites or standard paths
                let localPath = '.' + link;
                let exists = false;
                
                if (fs.existsSync(localPath)) {
                    if (fs.statSync(localPath).isDirectory()) {
                        if (fs.existsSync(path.join(localPath, 'index.html'))) {
                            exists = true;
                        }
                    } else {
                        exists = true;
                    }
                } else if (fs.existsSync(localPath + '.html')) {
                    exists = true;
                } else if (link.startsWith('/pages/') && fs.existsSync(localPath + '.html')) {
                    exists = true;
                } else if (link.startsWith('/vs/') || link.startsWith('/best/') || link.startsWith('/reviews/') || link.startsWith('/alternatives/')) {
                    const generatedName = '/pages/bofu_' + link.replace(/^\//, '').replace(/\//g, '_') + '.html';
                    if (fs.existsSync('.' + generatedName)) {
                        exists = true;
                    }
                }
                
                if (!exists) {
                    console.log(`❌ Broken link in ${fullPath}: ${link}`);
                    brokenLinksCount++;
                }
            }
        }
    }
}

checkLinksInDir('.');
console.log(`\nChecked ${checkedLinksCount} internal links across ${filesChecked} HTML files.`);
if (brokenLinksCount === 0) {
    console.log('✅ PERFECT! No broken internal links found.');
} else {
    console.log(`❌ FOUND ${brokenLinksCount} BROKEN LINKS!`);
}

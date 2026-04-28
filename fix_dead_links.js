const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'GSC') continue;
        
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            // Fix CSS dead link
            if (content.includes('href="/css/style.min.css"')) {
                content = content.replace(/href="\/css\/style\.min\.css"/g, 'href="/css/style.css"');
                modified = true;
            }
            
            // Fix beginner guide dead link
            if (content.includes('href="/collections/acoustic/beginner-guide.html"')) {
                content = content.replace(/href="\/collections\/acoustic\/beginner-guide\.html"/g, 'href="/collections/acoustic/best-for-beginners.html"');
                modified = true;
            }
            
            // Fix PRS dead link
            if (content.includes('href="/collections/electric/prs-se-mark-holcomb-signature-electric-guitar-in-holcomb-burst.html"')) {
                content = content.replace(/href="\/collections\/electric\/prs-se-mark-holcomb-signature-electric-guitar-in-holcomb-burst\.html"/g, 'href="/collections/electric/metal-guitars.html"');
                modified = true;
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed dead links in', fullPath);
            }
        }
    }
}

processDir(rootDir);
console.log('Finished fixing dead links.');

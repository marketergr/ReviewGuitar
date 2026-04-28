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
        } else if (file.endsWith('.html') && !fullPath.includes('templates')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            // Match <link rel="canonical" href="...">
            const canonicalRegex = /<link rel="canonical" href="([^"]+)">/g;
            let match;
            
            while ((match = canonicalRegex.exec(content)) !== null) {
                let originalUrl = match[1];
                let newUrl = originalUrl;
                
                // If it ends with index.html, remove it
                if (newUrl.endsWith('/index.html')) {
                    newUrl = newUrl.replace('/index.html', '/');
                } else if (newUrl.endsWith('index.html')) {
                    newUrl = newUrl.replace('index.html', '');
                } else if (newUrl.endsWith('.html')) {
                    newUrl = newUrl.replace('.html', '');
                }
                
                if (originalUrl !== newUrl) {
                    content = content.replace(match[0], `<link rel="canonical" href="${newUrl}">`);
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

processDir(rootDir);
console.log('Fixed canonical tags to use clean URLs.');

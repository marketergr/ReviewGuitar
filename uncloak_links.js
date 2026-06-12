const fs = require('fs');
const path = require('path');

const VERCEL_JSON = path.join(__dirname, 'vercel.json');
const vercelData = JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));

// Build map of /go/slug -> direct Amazon link
const linkMap = {};
if (vercelData.redirects) {
    vercelData.redirects.forEach(r => {
        if (r.source && r.source.startsWith('/go/') && !r.source.includes(':slug')) {
            linkMap[r.source] = r.destination;
        }
    });
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!['css', 'images', '.git', 'GSC', '.vercel', 'js'].includes(file)) {
                processDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Find all href="/go/..." and replace with direct amazon link if it exists in the map
            const regex = /href="(\/go\/[^"]+)"/g;
            content = content.replace(regex, (match, p1) => {
                if (linkMap[p1]) {
                    modified = true;
                    return `href="${linkMap[p1]}"`;
                }
                // If it's a dynamic slug not in vercel.json, fallback to amazon search
                const slug = p1.replace('/go/', '');
                modified = true;
                return `href="https://www.amazon.com/s?k=${slug}&tag=reviewsguitar-20"`;
            });

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Replaced cloaked links with direct Amazon links in ${fullPath}`);
            }
        }
    }
}

console.log('Replacing cloaked /go/ links with direct Amazon links to avoid AdBlockers...');
processDir(__dirname);
console.log('Complete!');

const fs = require('fs');
const path = require('path');

const hubs = [
    'collections/acoustic/index.html',
    'collections/electric/index.html',
    'collections/accessories/index.html',
    'collections/learning/index.html',
    'collections/buying/index.html'
];

hubs.forEach(hubPath => {
    const fullPath = path.join(process.cwd(), hubPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const dir = path.dirname(hubPath).replace(/\\/g, '/');
        
        // Find links in the "In-Depth Guides" section or similar that are relative
        // We look for href="link-name" and change to href="/dir/link-name"
        // But only if they don't start with / or http
        
        const linkRegex = /href=["']([^"']+)["']/g;
        content = content.replace(linkRegex, (match, link) => {
            if (link.startsWith('/') || link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('..')) {
                return match;
            }
            // It's relative. Make it absolute.
            const absoluteLink = `/${dir}/${link}`;
            console.log(`Fixing link in ${hubPath}: ${link} -> ${absoluteLink}`);
            return `href="${absoluteLink}"`;
        });
        
        fs.writeFileSync(fullPath, content);
    }
});

console.log('Finished fixing hub links.');

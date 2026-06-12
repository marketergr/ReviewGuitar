const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('index.html', 'utf8');
const regex = /href="(\/[^"]*)"/g;
let match;
const links = new Set();
while ((match = regex.exec(html)) !== null) {
    links.add(match[1]);
}
const broken = [];
for (const link of links) {
    if (link.startsWith('/go/') || link.startsWith('/images/') || link.startsWith('/css/') || link.startsWith('/js/') || link === '/') continue;
    let localPath = '.' + link;
    if (!fs.existsSync(localPath) && !fs.existsSync(localPath + '.html') && !fs.existsSync(path.join('.', 'pages', link.replace(/^\/(vs|best|reviews|alternatives)\//, 'bofu_$1_').replace(/\//g, '_') + '.html'))) {
        broken.push(link);
    }
}
console.log('Broken internal links in index.html:', broken);

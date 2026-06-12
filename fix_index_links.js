const fs = require('fs');
const path = require('path');

function fixLinks(filename) {
    if (!fs.existsSync(filename)) return;
    let html = fs.readFileSync(filename, 'utf8');
    const regex = /href="(\/[^"]+)"/g;
    
    html = html.replace(regex, (match, link) => {
        if (link.match(/\.[a-zA-Z0-9]+$/)) return match;
        if (link.startsWith('//')) return match;
    
        const localPath = '.' + link;
        
        if (fs.existsSync(localPath) && fs.statSync(localPath).isDirectory()) {
            if (fs.existsSync(path.join(localPath, 'index.html'))) {
                return `href="${link}/index.html"`;
            }
        }
        
        if (fs.existsSync(localPath + '.html')) {
            return `href="${link}.html"`;
        }
        
        if (link.startsWith('/pages/')) {
            if (fs.existsSync(localPath + '.html')) {
                return `href="${link}.html"`;
            }
        }
        
        if (link.startsWith('/vs/') || link.startsWith('/best/') || link.startsWith('/reviews/') || link.startsWith('/alternatives/')) {
            const generatedName = '/pages/bofu_' + link.replace(/^\//, '').replace(/\//g, '_') + '.html';
            if (fs.existsSync('.' + generatedName)) {
                return `href="${generatedName}"`;
            }
        }
    
        if (!link.endsWith('/')) {
            return `href="${link}.html"`;
        }
        
        return match;
    });
    
    fs.writeFileSync(filename, html);
    console.log(`Fixed links in ${filename}`);
}

fixLinks('index.html');
fixLinks('navigation.html');

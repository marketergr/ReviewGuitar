const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const pagesDir = path.join(rootDir, 'pages');

const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

const categories = {
    acoustic: [],
    electric: [],
    accessories: [],
    learning: [],
    buying: []
};

pages.forEach(file => {
    let title = file.replace('.html', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // read the actual h1 from the file if possible
    try {
        const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
        const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (h1Match) {
            title = h1Match[1].replace(/<[^>]+>/g, '').trim();
        }
    } catch(e) {}
    
    const obj = { file: `/pages/${file}`, title };
    
    if (file.startsWith('acoustic_')) categories.acoustic.push(obj);
    else if (file.startsWith('electric_')) categories.electric.push(obj);
    else if (file.startsWith('accessories_')) categories.accessories.push(obj);
    else if (file.startsWith('learning_')) categories.learning.push(obj);
    else if (file.startsWith('buying_')) categories.buying.push(obj);
});

// 1. Inject into Hub Pages
function injectIntoHub(hubPath, items, sectionTitle) {
    if (!fs.existsSync(hubPath)) return;
    let content = fs.readFileSync(hubPath, 'utf8');
    
    // Create the HTML block
    let html = `
        <div style="background: var(--glass); padding: 2rem; border-radius: var(--radius); border: 1px solid var(--border); margin-top: 3rem;">
            <h3 style="margin-bottom: 1.5rem; color: var(--primary);">${sectionTitle}</h3>
            <ul style="list-style-type: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
    `;
    
    items.forEach(item => {
        html += `<li><a href="${item.file}" style="color: var(--text); text-decoration: none; border-bottom: 1px dashed var(--border); transition: color 0.3s ease;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text)'">${item.title}</a></li>\n`;
    });
    
    html += `
            </ul>
        </div>
    `;
    
    // Inject before the closing </main> or before footer
    if (content.includes('</main>')) {
        content = content.replace('</main>', html + '\n    </main>');
    } else {
        // Fallback, inject before footer
        content = content.replace(/<footer/i, html + '\n    <footer');
    }
    
    fs.writeFileSync(hubPath, content);
    console.log(`Injected ${items.length} links into ${hubPath}`);
}

injectIntoHub(path.join(rootDir, 'collections/acoustic/index.html'), categories.acoustic, 'Acoustic Guitar Deep Dives');
injectIntoHub(path.join(rootDir, 'collections/electric/index.html'), categories.electric, 'Electric Guitar Deep Dives');
injectIntoHub(path.join(rootDir, 'collections/accessories/index.html'), categories.accessories, 'Accessory Buying Guides');
injectIntoHub(path.join(rootDir, 'index.html'), categories.buying, 'Guitar Buying Guides & Comparisons');
// We don't have a learning hub, inject learning into index.html as well
injectIntoHub(path.join(rootDir, 'index.html'), categories.learning, 'Guitar Learning Resources');

// 2. Generate sitemap.html
let sitemapHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitemap | ReviewsGuitar.com</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header>
        <div class="nav-container">
            <a href="/" class="logo">Reviews<span>Guitar</span></a>
        </div>
    </header>
    <main style="max-width: 1200px; margin: 4rem auto; padding: 0 2rem;">
        <h1 style="margin-bottom: 2rem;">Site Map</h1>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
`;

for (const [cat, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    sitemapHtml += `
            <div style="background: var(--glass); padding: 1.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
                <h3 style="color: var(--primary); margin-bottom: 1rem; text-transform: capitalize;">${cat} Articles</h3>
                <ul style="list-style-type: none; line-height: 1.6;">
    `;
    items.forEach(item => {
        sitemapHtml += `<li><a href="${item.file}">${item.title}</a></li>\n`;
    });
    sitemapHtml += `
                </ul>
            </div>
    `;
}

sitemapHtml += `
        </div>
    </main>
    <footer>
        <div class="footer-bottom">
            &copy; 2026 ReviewsGuitar.com | <a href="/sitemap.html">Sitemap</a> | <a href="/contact.html">Contact</a>
        </div>
    </footer>
</body>
</html>
`;

fs.writeFileSync(path.join(rootDir, 'sitemap.html'), sitemapHtml);
console.log('Generated sitemap.html');

// 3. Inject sitemap link into all footers
function updateFooters(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'GSC') continue;
        
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            updateFooters(fullPath);
        } else if (file.endsWith('.html') && file !== 'sitemap.html') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            // Look for Contact or Privacy Policy in footer to append Sitemap
            if (content.includes('href="/contact.html"') && !content.includes('href="/sitemap.html"')) {
                content = content.replace(/<a href="\/contact\.html">Contact<\/a>/, '<a href="/sitemap.html">Sitemap</a> | <a href="/contact.html">Contact</a>');
                modified = true;
            } else if (content.includes('href="/privacy.html"') && !content.includes('href="/sitemap.html"')) {
                 content = content.replace(/<a href="\/privacy\.html">Privacy Policy<\/a>/, '<a href="/sitemap.html">Sitemap</a> | <a href="/privacy.html">Privacy Policy</a>');
                 modified = true;
            } else if (content.includes('ReviewsGuitar.com. All rights reserved.') && !content.includes('href="/sitemap.html"')) {
                content = content.replace(/ReviewsGuitar\.com\. All rights reserved\./, 'ReviewsGuitar.com. All rights reserved. | <a href="/sitemap.html">Sitemap</a>');
                modified = true;
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

updateFooters(rootDir);
console.log('Added sitemap link to all footers.');

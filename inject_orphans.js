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
    
    try {
        const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
        // Match the h1 inside the <main> tag to get the specific article title
        const mainContent = content.split('<main>')[1] || content;
        const h1Match = mainContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
        if (h1Match) {
            title = h1Match[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
        }
    } catch(e) {}
    
    const obj = { file: `/pages/${file.replace('.html', '')}`, title };
    
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
            <h3 style="margin-bottom: 1.5rem; color: var(--primary); text-transform: uppercase;">${sectionTitle}</h3>
            <ul style="list-style-type: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
    `;
    
    items.forEach(item => {
        html += `<li><a href="${item.file}" style="color: var(--text); text-decoration: none; border-bottom: 1px dashed var(--border); transition: color 0.3s ease; text-transform: capitalize;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text)'">${item.title}</a></li>\n`;
    });
    
    html += `
            </ul>
        </div>
    `;
    
    // If section already exists, replace it, otherwise inject
    const startMarker = `<!-- START_${sectionTitle.replace(/\s+/g, '_')} -->`;
    const endMarker = `<!-- END_${sectionTitle.replace(/\s+/g, '_')} -->`;
    const fullBlock = `${startMarker}${html}${endMarker}`;

    const existingRegex = new RegExp(`<!-- START_${sectionTitle.replace(/\s+/g, '_')} -->[\\s\\S]*?<!-- END_${sectionTitle.replace(/\s+/g, '_')} -->`);
    
    if (existingRegex.test(content)) {
        content = content.replace(existingRegex, fullBlock);
    } else {
        if (content.includes('</main>')) {
            content = content.replace('</main>', fullBlock + '\n    </main>');
        } else {
            content = content.replace(/<footer/i, fullBlock + '\n    <footer');
        }
    }
    
    fs.writeFileSync(hubPath, content);
    console.log(`Injected ${items.length} links into ${hubPath}`);
}

injectIntoHub(path.join(rootDir, 'collections/acoustic/index.html'), categories.acoustic, 'Acoustic Guitar Deep Dives');
injectIntoHub(path.join(rootDir, 'collections/electric/index.html'), categories.electric, 'Electric Guitar Deep Dives');
injectIntoHub(path.join(rootDir, 'collections/accessories/index.html'), categories.accessories, 'Accessory Buying Guides');
injectIntoHub(path.join(rootDir, 'index.html'), categories.buying, 'Guitar Buying Guides & Comparisons');
injectIntoHub(path.join(rootDir, 'index.html'), categories.learning, 'Guitar Learning Resources');

// 2. Generate sitemap.html
let sitemapHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitemap | ReviewsGuitar.com</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="canonical" href="https://reviewsguitar.com/sitemap">
</head>
<body>
    <header>
        <div class="nav-container" style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
            <a href="/" class="logo" style="font-size: 2rem; text-decoration: none; font-weight: 800; color: var(--text);">REVIEWS<span>GUITAR</span></a>
        </div>
    </header>
    <main style="max-width: 1200px; margin: 2rem auto 4rem; padding: 0 2rem;">
        <h1 style="margin-bottom: 3rem; font-size: 3rem; text-transform: uppercase;">Full Site Directory</h1>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
`;

for (const [cat, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    sitemapHtml += `
            <div style="background: var(--glass); padding: 2rem; border-radius: var(--radius); border: 1px solid var(--border);">
                <h3 style="color: var(--primary); margin-bottom: 1.5rem; text-transform: uppercase; border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem; display: inline-block;">${cat} Articles</h3>
                <ul style="list-style-type: none; line-height: 1.8; margin-top: 1rem;">
    `;
    items.forEach(item => {
        sitemapHtml += `<li><a href="${item.file}" style="color: var(--text); text-decoration: none;">${item.title}</a></li>\n`;
    });
    sitemapHtml += `
                </ul>
            </div>
    `;
}

sitemapHtml += `
        </div>
    </main>
    <footer class="footer-hub" style="margin-top: 4rem; padding: 4rem 2rem; border-top: 1px solid var(--border); text-align: center;">
        <p>&copy; 2026 ReviewsGuitar.com | <a href="/contact">Contact</a></p>
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
            
            if (content.includes('href="/sitemap"')) continue; // Already updated

            // Support both "Contact" and "Contact Us" with or without Us
            const contactRegex = /<a href="\/contact(?:\.html)?">Contact(?: Us)?<\/a>/i;
            if (contactRegex.test(content)) {
                content = content.replace(contactRegex, '<a href="/sitemap">Sitemap</a> | <a href="/contact">Contact Us</a>');
                modified = true;
            } else if (content.includes('ReviewsGuitar.com. All Rights Reserved.')) {
                content = content.replace('ReviewsGuitar.com. All Rights Reserved.', 'ReviewsGuitar.com. All Rights Reserved. | <a href="/sitemap">Sitemap</a>');
                modified = true;
            } else if (content.includes('Built for the modern musician.')) {
                content = content.replace('Built for the modern musician.', 'Built for the modern musician. | <a href="/sitemap">Sitemap</a>');
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

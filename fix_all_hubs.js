const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

function fixHub(filePath, prefix, title) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Convert all manual .html links to clean URLs
    // Exclude external links and sitemap.html
    content = content.replace(/href="([^"]+)\.html"/g, (match, p1) => {
        if (p1.startsWith('http') || p1 === 'sitemap') return match;
        return `href="${p1}"`;
    });

    // 2. Inject Programmatic Links if missing
    if (!content.includes('Deep Dives')) {
        const pagesDir = path.join(rootDir, 'pages');
        const files = fs.readdirSync(pagesDir).filter(f => f.startsWith(prefix) && f.endsWith('.html'));
        
        if (files.length > 0) {
            let linksHtml = '';
            files.forEach(file => {
                const fullPath = path.join(pagesDir, file);
                const fileContent = fs.readFileSync(fullPath, 'utf8');
                const h1Match = fileContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
                let linkTitle = h1Match ? h1Match[1].trim() : file.replace('.html', '').replace(/_/g, ' ');
                linkTitle = linkTitle.replace(/ReviewsGuitar\.com/g, '').replace(/Expert Analysis & Reviews 2026/g, '').replace(/\|/g, '').trim();
                
                const cleanLink = `/pages/${file.replace('.html', '')}`;
                linksHtml += `<li><a href="${cleanLink}" style="color: var(--text); text-decoration: none; border-bottom: 1px dashed var(--border); transition: color 0.3s ease; text-transform: capitalize;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text)'">${linkTitle}</a></li>\n`;
            });

            const deepDivesHtml = `
    <!-- START_${prefix}_Deep_Dives -->
        <div style="background: var(--glass); padding: 2rem; border-radius: var(--radius); border: 1px solid var(--border); margin-top: 3rem;">
            <h3 style="margin-bottom: 1.5rem; color: var(--primary); text-transform: uppercase;">${title} Deep Dives</h3>
            <ul style="list-style-type: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
    ${linksHtml}
            </ul>
        </div>
    <!-- END_${prefix}_Deep_Dives -->
    `;
            
            // Find insertion point (before </main>)
            if (content.includes('</main>')) {
                content = content.replace('</main>', `${deepDivesHtml}\n    </main>`);
            } else {
                content += deepDivesHtml;
            }
        }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Processed ${filePath}`);
}

const hubs = [
    { path: 'collections/acoustic/index.html', prefix: 'acoustic', title: 'Acoustic Guitar' },
    { path: 'collections/electric/index.html', prefix: 'electric', title: 'Electric Guitar' },
    { path: 'collections/accessories/index.html', prefix: 'accessories', title: 'Accessory' },
    { path: 'collections/learning/index.html', prefix: 'learning', title: 'Guitar Learning' },
    { path: 'collections/buying/index.html', prefix: 'buying', title: 'Buying Guide' },
    { path: 'index.html', prefix: 'home', title: 'Site' }
];

hubs.forEach(h => {
    const fullPath = path.join(rootDir, h.path);
    if (fs.existsSync(fullPath)) {
        fixHub(fullPath, h.prefix, h.title);
    }
});

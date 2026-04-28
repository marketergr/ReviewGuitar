const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

function cleanAllPages() {
    const allFiles = [];
    
    function walk(dir) {
        fs.readdirSync(dir).forEach(f => {
            const fullPath = path.join(dir, f);
            if (fs.statSync(fullPath).isDirectory()) {
                if (f !== 'node_modules' && f !== '.git') walk(fullPath);
            } else if (f.endsWith('.html')) {
                allFiles.push(fullPath);
            }
        });
    }
    
    walk(rootDir);
    
    allFiles.forEach(filePath => {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        
        // 1. Fix all .html links to Clean URLs
        const newContent = content.replace(/href="([^"]+)\.html"/g, (match, p1) => {
            if (p1.startsWith('http') || p1 === 'sitemap') return match;
            changed = true;
            return `href="${p1}"`;
        });
        
        if (changed) {
            fs.writeFileSync(filePath, newContent);
        }
    });
}

function fixHubs() {
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
        if (!fs.existsSync(fullPath)) return;
        
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Remove existing Deep Dives blocks to start fresh
        const blockRegex = /<!-- START_.*?_Deep_Dives -->[\s\S]*?<!-- END_.*?_Deep_Dives -->/g;
        content = content.replace(blockRegex, '');

        const pagesDir = path.join(rootDir, 'pages');
        const files = fs.readdirSync(pagesDir).filter(f => f.startsWith(h.prefix) && f.endsWith('.html'));
        
        if (files.length > 0) {
            let linksHtml = '';
            files.forEach(file => {
                const fPath = path.join(pagesDir, file);
                const fContent = fs.readFileSync(fPath, 'utf8');
                
                // Better H1 extraction
                const h1Match = fContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
                let linkTitle = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : '';
                
                // Fallback to filename if title is empty or just the site name
                if (!linkTitle || linkTitle.toLowerCase().includes('reviewsguitar.com') && linkTitle.length < 20) {
                    linkTitle = file.replace('.html', '').split('_').slice(1).join(' ');
                }

                // Final cleaning
                linkTitle = linkTitle.replace(/ReviewsGuitar\.com/g, '')
                                    .replace(/Expert Analysis & Reviews 2026/g, '')
                                    .replace(/\|/g, '')
                                    .trim();
                
                if (!linkTitle) linkTitle = file.replace('.html', '').replace(/_/g, ' ');

                const cleanLink = `/pages/${file.replace('.html', '')}`;
                linksHtml += `    <li><a href="${cleanLink}" style="color: var(--text); text-decoration: none; border-bottom: 1px dashed var(--border); transition: color 0.3s ease; text-transform: capitalize;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text)'">${linkTitle}</a></li>\n`;
            });

            const deepDivesHtml = `
<!-- START_${h.prefix}_Deep_Dives -->
    <div style="background: var(--glass); padding: 2rem; border-radius: var(--radius); border: 1px solid var(--border); margin-top: 3rem;">
        <h3 style="margin-bottom: 1.5rem; color: var(--primary); text-transform: uppercase;">${h.title} Deep Dives</h3>
        <ul style="list-style-type: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
${linksHtml}
        </ul>
    </div>
<!-- END_${h.prefix}_Deep_Dives -->
`;
            
            if (content.includes('</main>')) {
                content = content.replace('</main>', `${deepDivesHtml}\n    </main>`);
            } else {
                content += deepDivesHtml;
            }
        }
        
        fs.writeFileSync(fullPath, content);
        console.log(`Refreshed ${h.path}`);
    });
}

cleanAllPages();
fixHubs();

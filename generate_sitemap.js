const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.guitarreview.com';
const PROJECT_ROOT = __dirname;

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'css' && file !== 'js' && file !== 'images') {
                getFiles(filePath, fileList);
            }
        } else {
            if (file.endsWith('.html')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

function generateSitemap() {
    console.log("Locating all pages for sitemap...");
    const htmlFiles = getFiles(PROJECT_ROOT);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    htmlFiles.forEach(file => {
        const relativePath = path.relative(PROJECT_ROOT, file).replace(/\\/g, '/');
        const url = `${BASE_URL}/${relativePath}`.replace('/index.html', '/');
        
        xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${relativePath === 'index.html' ? 'daily' : 'weekly'}</changefreq>
    <priority>${relativePath === 'index.html' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    fs.writeFileSync('sitemap.xml', xml);
    console.log(`Success! sitemap.xml generated with ${htmlFiles.length} URLs.`);
}

generateSitemap();

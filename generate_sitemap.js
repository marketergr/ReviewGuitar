const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const domain = 'https://reviewsguitar.com';
const sitemapPath = path.join(rootDir, 'sitemap.xml');

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'GSC') continue;
        
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.html')) {
            // Ignore templates
            if (fullPath.includes('templates')) continue;
            
            let relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
            
            // Format URL (remove index.html or .html for clean urls)
            let urlPath = relPath;
            if (urlPath === 'index.html') urlPath = '';
            else if (urlPath.endsWith('/index.html')) urlPath = urlPath.replace('/index.html', '/');
            else if (urlPath.endsWith('.html')) urlPath = urlPath.replace('.html', '');
            
            const fullUrl = `${domain}/${urlPath}`;
            
            // Assign priority and changefreq based on depth
            let priority = '0.6';
            let changefreq = 'monthly';
            
            if (urlPath === '') {
                priority = '1.0';
                changefreq = 'weekly';
            } else if (urlPath.startsWith('collections/') && urlPath.endsWith('/')) {
                priority = '0.8';
                changefreq = 'weekly';
            }
            
            xml += `  <url>\n    <loc>${fullUrl}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
        }
    }
}

processDir(rootDir);

xml += `</urlset>`;

fs.writeFileSync(sitemapPath, xml);
console.log('Successfully generated sitemap.xml with ' + (xml.match(/<url>/g) || []).length + ' URLs');

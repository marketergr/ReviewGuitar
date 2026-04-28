const fs = require('fs');
const path = require('path');

const asinMap = new Map();

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'css' && file !== 'images' && file !== '.git' && file !== 'GSC') {
                processDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // In these templates, products are often in a block:
            // "name":"Yamaha FG800 Acoustic Guitar" in JSON-LD
            // Or <h3 class="product-title">Yamaha FG800 Acoustic Guitar</h3>
            // Or <img alt="...">
            
            // Let's just find the JSON-LD schema
            const schemaMatch = content.match(/<script type="application\/ld\+json">({.*?})<\/script>/);
            if (schemaMatch) {
                try {
                    const data = JSON.parse(schemaMatch[1]);
                    if (data['@graph']) {
                        data['@graph'].forEach(item => {
                            if (item['@type'] === 'Product') {
                                // Find the ASIN for this product.
                                // We know the name, we just need the ASIN.
                                // We can look for the string in the file, and find the closest /go/ASIN.
                            }
                        });
                    }
                } catch(e){}
            }
            
            // Let's just split by 'href="/go/'
            const parts = content.split('href="/go/');
            for (let i = 1; i < parts.length; i++) {
                const asin = parts[i].substring(0, 10);
                if (asinMap.has(asin)) continue;
                
                // look backwards in parts[i-1] for an alt text or product title
                const prev = parts[i-1];
                let name = "Unknown";
                
                // try to match <h3 class="product-title">...</h3>
                const titles = prev.match(/<h3 class="product-title">([^<]+)<\/h3>/g);
                if (titles && titles.length > 0) {
                    name = titles[titles.length - 1].replace(/<[^>]+>/g, '').trim();
                } else {
                    const alts = prev.match(/alt="([^"]+)"/g);
                    if (alts && alts.length > 0) {
                        name = alts[alts.length - 1].replace('alt="', '').replace('"', '').replace(' - Expert Review & Analysis', '').replace(' Technical Comparison', '').trim();
                    }
                }
                
                if (name !== "Unknown") {
                    asinMap.set(asin, name);
                }
            }
        }
    }
}

processDir(process.cwd());

const mapObj = Object.fromEntries(asinMap);
fs.writeFileSync('asin_mapping.json', JSON.stringify(mapObj, null, 2));
console.log('Extracted mapping to asin_mapping.json');

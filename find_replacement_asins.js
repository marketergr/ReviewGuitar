const fs = require('fs');
const https = require('https');

async function searchProduct(name) {
    const apiKey = process.env.RAINFOREST_API_KEY;
    if (!apiKey) {
        console.error("❌ Error: Please set the RAINFOREST_API_KEY environment variable.");
        process.exit(1);
    }
    
    return new Promise((resolve) => {
        const url = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(name)}`;
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.search_results && json.search_results.length > 0) {
                        const topResult = json.search_results[0];
                        resolve({
                            found: true,
                            newAsin: topResult.asin,
                            newTitle: topResult.title
                        });
                    } else {
                        resolve({ found: false });
                    }
                } catch (e) {
                    console.error(`⚠️ Error parsing search response for ${name}: ${e.message}`);
                    resolve({ found: false });
                }
            });
        });
        
        req.on('error', (e) => {
            console.error(`⚠️ Network error searching for ${name}: ${e.message}`);
            resolve({ found: false });
        });
    });
}

async function main() {
    if (!fs.existsSync('invalid_asins.json')) {
        console.error("❌ invalid_asins.json not found. Run validate_asins.js first.");
        return;
    }
    
    const invalidItems = JSON.parse(fs.readFileSync('invalid_asins.json', 'utf8'));
    console.log(`🔍 Searching for replacements for ${invalidItems.length} dead ASINs...\n`);
    
    const replacements = {};
    
    for (const item of invalidItems) {
        const oldAsin = item.asin;
        const name = item.name;
        
        console.log(`Searching for: ${name}...`);
        const result = await searchProduct(name);
        
        if (result.found) {
            console.log(`   ✅ Found new ASIN: ${result.newAsin} (${result.newTitle.substring(0, 50)}...)`);
            replacements[oldAsin] = {
                name: name,
                newAsin: result.newAsin,
                newTitle: result.newTitle
            };
        } else {
            console.log(`   ❌ No results found for: ${name}`);
            replacements[oldAsin] = {
                name: name,
                newAsin: null,
                newTitle: "Not Found"
            };
        }
        
        // Slight delay to be nice to the API
        await new Promise(r => setTimeout(r, 500));
    }
    
    fs.writeFileSync('asin_replacements.json', JSON.stringify(replacements, null, 2));
    console.log(`\n🎉 Done! Saved suggested replacements to asin_replacements.json`);
}

main();

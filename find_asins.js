const https = require('https');
const fs = require('fs');

const invalidAsins = {
  "1495059960": "JustinGuitar Beginner Course",
  "B08VJKZ8PK": "D'Addario XS Coated Strings",
  "B06Y4G7NQD": "TC Electronic PolyTune 3",
  "B0BYFC65L7": "Yamaha FG800 Acoustic Guitar",
  "B071FV8G1Z": "Fender CD-60S Dreadnought Acoustic Guitar",
  "B01CFOAQP2": "Yamaha FG830 Acoustic Guitar",
  "B0GFXZ1PNS": "Martin D-10E Road Series",
  "B07T7H8WKY": "Squier Classic Vibe Mustang Bass",
  "B08L335N1Q": "Fender American Pro II Jazz Bass",
  "B08N5WRWNW": "Fender Player Stratocaster",
  "B0DYK5G1ZL": "Boss Katana-50 MkII Combo Amp",
  "B091BFC6NS": "Squier Affinity Telecaster",
  "B0FKC3BDHN": "PRS SE Silver Sky",
  "B0DK1WMVJH": "Fender American Ultra Telecaster",
  "B0GFFM786H": "PRS SE Mark Holcomb Signature",
  "B07NLY3N2X": "Gibson Les Paul Standard 60s",
  "B0D2LQNDS7": "Fender Player Plus Telecaster",
  "B07T7H7KXX": "Squier Classic Vibe 60s Stratocaster",
  "B0010X7LF8": "Yamaha Pacifica 112V",
  "B0GQC1PWR4": "Epiphone SG Standard 61",
  "B0C2CD2JJW": "Jackson JS22 Dinky",
  "B07L5YYHQC": "Fender Play",
  "B004FEPB9Q": "Guitar Tricks",
  "B0CZ2D7P9X": "Yamaha FG800",
  "B07CXK87YV": "Fender Player Stratocaster",
  "B0CTJ734SN": "Taylor 214ce Plus Acoustic Guitar",
  "B0F9B64NS1": "Martin D-18 Standard Series"
};

async function searchDDG(query) {
    return new Promise((resolve) => {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // look for amazon.com/dp/ASIN or amazon.com/product/ASIN
                // ASIN is 10 chars, usually starts with B or is a 10 digit ISBN
                const matches = data.match(/amazon\.com\/(?:dp|gp\/product)\/([A-Z0-9]{10})/gi);
                if (matches && matches.length > 0) {
                    const asins = matches.map(m => m.split('/').pop());
                    // Return the most frequent ASIN
                    const counts = {};
                    let maxCount = 0;
                    let bestAsin = null;
                    for (const a of asins) {
                        counts[a] = (counts[a] || 0) + 1;
                        if (counts[a] > maxCount) {
                            maxCount = counts[a];
                            bestAsin = a;
                        }
                    }
                    resolve(bestAsin);
                } else {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
    });
}

async function main() {
    const replacements = {};
    for (const [oldAsin, name] of Object.entries(invalidAsins)) {
        const query = `site:amazon.com/dp/ "${name}"`;
        const newAsin = await searchDDG(query);
        console.log(`[${name}] ${oldAsin} -> ${newAsin || 'NOT FOUND'}`);
        if (newAsin && newAsin !== oldAsin) {
            replacements[oldAsin] = newAsin;
        }
        await new Promise(r => setTimeout(r, 1000)); // sleep to avoid rate limits
    }
    fs.writeFileSync('asin_replacements.json', JSON.stringify(replacements, null, 2));
    console.log(`Found ${Object.keys(replacements).length} replacements.`);
}

main();

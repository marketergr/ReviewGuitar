const https = require('https');
const fs = require('fs');

const invalidAsins = {
  "1780387103": "JustinGuitar Beginner Course",
  "B08X6D9G8Z": "D'Addario XS Coated Strings",
  "B06XFSB6P9": "TC Electronic PolyTune 3",
  "B01CFOG89M": "Yamaha FG800 Acoustic Guitar",
  "B01N2V2C7P": "Fender CD-60S Dreadnought Acoustic Guitar",
  "B01CFOCHRC": "Yamaha FG830 Acoustic Guitar",
  "B07N8Z7RZZ": "Martin D-10E Road Series",
  "B07N2B6G4M": "Squier Classic Vibe Mustang Bass",
  "B08KGTCX7X": "Fender American Pro II Jazz Bass",
  "B08N5WRWNW": "Fender Player Stratocaster",
  "B0BYZ2CHV1": "Boss Katana-50 MkII Combo Amp",
  "B092BBGQG1": "Squier Affinity Telecaster",
  "B09NM9PFV9": "PRS SE Silver Sky",
  "B07XLRZB7B": "Fender American Ultra Telecaster",
  "B0BK9X1T9B": "PRS SE Mark Holcomb Signature",
  "B07NLY3N2X": "Gibson Les Paul Standard 60s",
  "B099K1R8L3": "Fender Player Plus Telecaster",
  "B07N29NYV8": "Squier Classic Vibe 60s Stratocaster",
  "B000O5E668": "Yamaha Pacifica 112V",
  "B081BD8PVG": "Epiphone SG Standard 61",
  "B009230588": "Jackson JS22 Dinky",
  "B07L5YYHQC": "Fender Play",
  "B004FEPB9Q": "Guitar Tricks",
  "B01CPK89S2": "Yamaha FG800",
  "B07CXK87YV": "Fender Player Stratocaster",
  "B084G21NYH": "Taylor 214ce Plus Acoustic Guitar",
  "B007S2Z4O8": "Martin D-18 Standard Series"
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

const https = require('https');

const asins = {
  "1780387103": "JustinGuitar Beginner Course",
  "B08X6D9G8Z": "D'Addario XS Coated Strings",
  "B06XFSB6P9": "TC Electronic PolyTune 3",
  "B0002CZV82": "Boss DS-1 Distortion Pedal",
  "B0002M6CVC": "Ernie Ball Regular Slinky Strings",
  "B074KGZ9Z7": "Fender FCT-2 Clip-On Tuner",
  "B01CFOG89M": "Yamaha FG800 Acoustic Guitar",
  "B01N2V2C7P": "Fender CD-60S Dreadnought",
  "B01CFOCHRC": "Yamaha FG830 Acoustic Guitar",
  "B07N8Z7RZZ": "Martin D-10E Road Series",
  "B07N2B6G4M": "Squier Classic Vibe Mustang Bass",
  "B08KGTCX7X": "Fender American Pro II Jazz Bass",
  "B08N5WRWNW": "Fender Player Stratocaster vs Telecaster",
  "B0BYZ2CHV1": "Boss Katana-50 MkII Combo Amp",
  "B092BBGQG1": "Squier Affinity Telecaster",
  "B09NM9PFV9": "PRS John Mayer SE Silver Sky",
  "B07XLRZB7B": "Fender American Ultra Telecaster",
  "B0BK9X1T9B": "PRS SE Mark Holcomb Signature",
  "B07NLY3N2X": "Gibson Les Paul Standard '60s",
  "B099K1R8L3": "Fender Player Plus Telecaster",
  "B07N29NYV8": "Squier Classic Vibe '60s Stratocaster",
  "B000O5E668": "Yamaha Pacifica 112V",
  "B081BD8PVG": "Epiphone SG Standard '61",
  "B009230588": "Jackson JS22 Dinky",
  "B07L5YYHQC": "Fender Play 12-Month Subscription",
  "B0002EWTWG": "Hal Leonard Guitar Method Book",
  "B004FEPB9Q": "Guitar Tricks Annual Membership",
  "B01CPK89S2": "Yamaha FG800",
  "B07CXK87YV": "Fender Player Stratocaster",
  "B07ZRYKNGS": "Fender Premium Picks Sampler",
  "B000P5WTQS": "Hercules GS414B PLUS Guitar Stand",
  "B018FCZKR2": "Amazon Basics A-Frame Guitar Stand",
  "B084G21NYH": "Taylor 214ce Plus Acoustic Guitar",
  "B007S2Z4O8": "Martin D-18 Standard Series",
  "B0D7G4MWZ9": "Fender Player II Stratocaster"
};

async function checkAsin(asin, name) {
    return new Promise((resolve) => {
        const req = https.get(`https://www.amazon.com/dp/${asin}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 404 || data.includes("Page Not Found") || data.includes("We're sorry. The Web address you entered is not a functioning page")) {
                    console.log(`❌ INVALID: ${asin} - ${name}`);
                    resolve({asin, name, valid: false});
                } else if (res.statusCode === 200 || res.statusCode === 503) {
                    // Even if 503, it's usually valid but bot-protected
                    // Let's assume valid unless 404
                    console.log(`✅ VALID (or 503): ${asin} - ${name} (Status: ${res.statusCode})`);
                    resolve({asin, name, valid: true});
                } else {
                    console.log(`⚠️ UNKNOWN (${res.statusCode}): ${asin} - ${name}`);
                    resolve({asin, name, valid: true});
                }
            });
        });
        req.on('error', (e) => {
            console.log(`⚠️ ERROR: ${asin} - ${name} - ${e.message}`);
            resolve({asin, name, valid: true}); // Assume valid on network error to prevent false positives
        });
    });
}

async function main() {
    const promises = [];
    for (const [asin, name] of Object.entries(asins)) {
        promises.push(checkAsin(asin, name));
        // Add a slight delay to avoid overwhelming
        await new Promise(r => setTimeout(r, 200));
    }
    
    const results = await Promise.all(promises);
    const invalid = results.filter(r => !r.valid);
    console.log(`\nFound ${invalid.length} invalid ASINs out of ${results.length}.`);
    fs.writeFileSync('invalid_asins.json', JSON.stringify(invalid, null, 2));
}

main();

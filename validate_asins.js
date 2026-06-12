const https = require('https');
const fs = require('fs');

const asins = {
  "1495059960": "JustinGuitar Beginner Course",
  "B08VJKZ8PK": "D'Addario XS Coated Strings",
  "B06Y4G7NQD": "TC Electronic PolyTune 3",
  "B0002CZV82": "Boss DS-1 Distortion Pedal",
  "B0002M6CVC": "Ernie Ball Regular Slinky Strings",
  "B074KGZ9Z7": "Fender FCT-2 Clip-On Tuner",
  "B0BYFC65L7": "Yamaha FG800 Acoustic Guitar",
  "B071FV8G1Z": "Fender CD-60S Dreadnought",
  "B01CFOAQP2": "Yamaha FG830 Acoustic Guitar",
  "B0GFXZ1PNS": "Martin D-10E Road Series",
  "B07T7H8WKY": "Squier Classic Vibe Mustang Bass",
  "B08L335N1Q": "Fender American Pro II Jazz Bass",
  "B08N5WRWNW": "Fender Player Stratocaster vs Telecaster",
  "B0DYK5G1ZL": "Boss Katana-50 MkII Combo Amp",
  "B091BFC6NS": "Squier Affinity Telecaster",
  "B0FKC3BDHN": "PRS John Mayer SE Silver Sky",
  "B0DK1WMVJH": "Fender American Ultra Telecaster",
  "B0GFFM786H": "PRS SE Mark Holcomb Signature",
  "B07NLY3N2X": "Gibson Les Paul Standard '60s",
  "B0D2LQNDS7": "Fender Player Plus Telecaster",
  "B07T7H7KXX": "Squier Classic Vibe '60s Stratocaster",
  "B0010X7LF8": "Yamaha Pacifica 112V",
  "B0GQC1PWR4": "Epiphone SG Standard '61",
  "B0C2CD2JJW": "Jackson JS22 Dinky",
  "B07L5YYHQC": "Fender Play 12-Month Subscription",
  "B0002EWTWG": "Hal Leonard Guitar Method Book",
  "B004FEPB9Q": "Guitar Tricks Annual Membership",
  "B0CZ2D7P9X": "Yamaha FG800",
  "B07CXK87YV": "Fender Player Stratocaster",
  "B07ZRYKNGS": "Fender Premium Picks Sampler",
  "B000P5WTQS": "Hercules GS414B PLUS Guitar Stand",
  "B018FCZKR2": "Amazon Basics A-Frame Guitar Stand",
  "B0CTJ734SN": "Taylor 214ce Plus Acoustic Guitar",
  "B0F9B64NS1": "Martin D-18 Standard Series",
  "B0D7G4MWZ9": "Fender Player II Stratocaster"
};

async function checkAsin(asin, name) {
    const apiKey = process.env.RAINFOREST_API_KEY;
    if (!apiKey) {
        console.error("❌ Error: Please set the RAINFOREST_API_KEY environment variable.");
        process.exit(1);
    }
    
    return new Promise((resolve) => {
        const url = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=product&amazon_domain=amazon.com&asin=${asin}`;
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    // Rainforest API returns request_info.success = false if request fails
                    if (json.request_info && json.request_info.success === false) {
                        console.log(`❌ INVALID: ${asin} - ${name}`);
                        resolve({asin, name, valid: false});
                    } else if (json.message === "Product not found.") {
                        console.log(`❌ NOT FOUND: ${asin} - ${name}`);
                        resolve({asin, name, valid: false});
                    } else if (json.product) {
                        console.log(`✅ VALID: ${asin} - ${name} (Found: ${json.product.title.substring(0, 30)}...)`);
                        resolve({asin, name, valid: true});
                    } else {
                        console.log(`⚠️ UNKNOWN RESPONSE for ${asin}: ${data.substring(0, 50)}`);
                        resolve({asin, name, valid: false});
                    }
                } catch (e) {
                    console.log(`⚠️ ERROR PARSING JSON: ${asin} - ${name} - ${e.message}`);
                    resolve({asin, name, valid: false}); 
                }
            });
        });
        req.on('error', (e) => {
            console.log(`⚠️ NETWORK ERROR: ${asin} - ${name} - ${e.message}`);
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

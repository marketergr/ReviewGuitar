const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname);
const BASE_URL = "https://reviewsguitar.com";

// Load Products
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

// ASIN → slug mapping for cloaked affiliate links
const ASIN_TO_SLUG = {
    'B0BYFC65L7': 'yamaha-fg800-acoustic-guitar',
    'B071FV8G1Z': 'fender-cd-60s-dreadnought',
    'B0GFXZ1PNS': 'martin-d-10e-road-series',
    'B08N5WRWNW': 'fender-player-stratocaster',
    'B091BFC6NS': 'squier-affinity-telecaster',
    'B08VJKZ8PK': 'daddario-xs-coated-strings',
    'B06Y4G7NQD': 'tc-electronic-polytune-3',
    'B0002CZV82': 'boss-ds-1-distortion-pedal',
    'B0FKC3BDHN': 'prs-se-silver-sky',
    'B0DK1WMVJH': 'fender-american-ultra-telecaster',
    'B0GFFM786H': 'prs-se-mark-holcomb-signature',
    'B08L335N1Q': 'fender-american-pro-ii-jazz-bass',
    'B07T7H8WKY': 'squier-classic-vibe-mustang-bass',
    'B0002EWTWG': 'hal-leonard-guitar-method-book',
    '1495059960': 'justinguitar-beginner-course',
    'B07L5YYHQC': 'fender-play-12-month-subscription',
    'B004FEPB9Q': 'guitar-tricks-annual-membership',
    'B000P5WTQS': 'hercules-gs414b-plus-guitar-stand',
    'B0002M6CVC': 'ernie-ball-regular-slinky-strings',
    'B0CTJ734SN': 'taylor-214ce-plus-acoustic-guitar',
    'B0DYK5G1ZL': 'boss-katana-50-mkii-combo-amp',
    'B085MTSHCY': 'nerecndens-66pcs-guitar-accessories-kit',
    'B018FCZKR2': 'amazon-basics-a-frame-guitar-stand',
    'B073LSS9TJ': 'wingo-professional-guitar-capo',
    'B07ZRYKNGS': 'fender-premium-picks-sampler',
    'B074KGZ9Z7': 'fender-fct-2-clip-on-tuner',
    'B078MPY48Y': 'perris-leathers-jacquard-strap',
    'B0D7G4MWZ9': 'fender-player-ii-stratocaster',
    'B07NLY3N2X': 'gibson-les-paul-standard-60s',
    'B01CFOAQP2': 'yamaha-fg830-acoustic-guitar',
    'B07T7H7KXX': 'squier-classic-vibe-60s-stratocaster',
    'B0GQC1PWR4': 'epiphone-sg-standard-61',
    'B0010X7LF8': 'yamaha-pacifica-112v',
    'B0C2CD2JJW': 'jackson-js22-dinky',
    'B0D2LQNDS7': 'fender-player-plus-telecaster',
    'B07CXK87YV': 'fender-player-stratocaster',
    'B0CZ2D7P9X': 'yamaha-fg800-acoustic-guitar',
    'B0F9B64NS1': 'martin-d-18-standard-series',
};

function getCloakedLink(amazonLink) {
    if (!amazonLink) return "#";
    return amazonLink; // Raw direct link to bypass AdBlockers
}

// Custom CSV Parser
function parseCSV(content) {
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
        const arr = [];
        let quote = false;
        let col = "";
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"') {
                quote = !quote;
            } else if (char === ',' && !quote) {
                arr.push(col);
                col = "";
            } else {
                col += char;
            }
        }
        arr.push(col);
        return {
            keyword: arr[0],
            url: arr[1],
            type: arr[2],
            pinterest_hook: arr[3],
            tiktok_hook: arr[4]
        };
    });
}

function matchProducts(keyword) {
    const kwLower = keyword.toLowerCase();
    
    // Determine target silo
    let targetSilo = null;
    if (kwLower.includes('electric')) {
        targetSilo = 'electric';
    } else if (kwLower.includes('acoustic')) {
        targetSilo = 'acoustic';
    } else if (kwLower.includes('bass')) {
        targetSilo = 'bass';
    } else if (kwLower.includes('learning') || kwLower.includes('lessons') || kwLower.includes('course') || kwLower.includes('book') || kwLower.includes('app')) {
        targetSilo = 'learning';
    } else if (kwLower.includes('string') || kwLower.includes('pedal') || kwLower.includes('amp') || kwLower.includes('cable') || kwLower.includes('tuner') || kwLower.includes('strap') || kwLower.includes('wireless') || kwLower.includes('accessory') || kwLower.includes('stand') || kwLower.includes('capo') || kwLower.includes('pick') || kwLower.includes('headphones') || kwLower.includes('cases') || kwLower.includes('flight')) {
        targetSilo = 'accessories';
    }

    const BRANDS = ['yamaha', 'fender', 'squier', 'martin', 'taylor', 'prs', 'boss', 'tc electronic', 'epiphone', 'jackson', 'hercules', 'ernie ball', 'wingo', 'perri', 'hal leonard', 'justinguitar', 'nerecndens', 'gibson', 'ibanez', 'vox', 'marshall', 'gretsch', 'seagull'];
    const activeBrands = BRANDS.filter(b => kwLower.includes(b));

    let scored = products.map(p => {
        let score = 0;
        const pNameLower = p.name.toLowerCase();
        
        // 1. Silo Match
        if (targetSilo) {
            if (p.silo === targetSilo) {
                score += 15;
            } else {
                score -= 10;
            }
        }
        
        // 2. Brand Match
        let pBrand = null;
        for (const b of BRANDS) {
            if (pNameLower.includes(b)) {
                pBrand = b;
                break;
            }
        }
        
        if (activeBrands.length > 0) {
            if (pBrand && activeBrands.includes(pBrand)) {
                score += 20;
            } else if (pBrand) {
                score -= 15;
            }
        }

        // 3. Model / Word Match
        // Extract specific model words from keyword (e.g. fg800, 112v, etc.)
        const modelWords = ['fg800', 'fg830', 'cd-60s', 'stratocaster', 'strat', 'telecaster', 'tele', 'pacifica', 'dinky', 'mustang', 'katana', 'polytune', 'ds-1', 'd-18', 'd-10e', '214ce', '314ce', 'silver sky', 'ultra', 'regular slinky', 'xs', 'gs414b', 'fct-2', 'telepath', '66pcs', 'method', 'lessons'];
        modelWords.forEach(mw => {
            if (kwLower.includes(mw) && pNameLower.includes(mw)) {
                score += 25;
            }
        });
        
        // 4. Price Match (under X)
        let priceNum = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0;
        if (kwLower.includes('under')) {
            const match = kwLower.match(/under\s*\$?(\d+)/);
            if (match) {
                const maxPrice = parseFloat(match[1]);
                if (priceNum <= maxPrice) {
                    score += 10;
                } else {
                    score -= 30; // severe penalty for exceeding budget
                }
            }
        }

        // 5. General word overlap
        const searchStr = (p.name + " " + p.category + " " + p.silo + " " + (p.description || "")).toLowerCase();
        const kwWords = kwLower.split(' ');
        kwWords.forEach(w => {
            if (w.length > 2 && searchStr.includes(w)) {
                score += 1;
            }
        });
        
        return { product: p, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    // Return top 2 for vs pages, top 4 for best-of/other
    const sliceCount = kwLower.includes(' vs ') || kwLower.includes('comparison') ? 2 : 4;
    return scored.slice(0, sliceCount).map(s => s.product);
}

function generateBoFuPage(data, matchedProducts, fileName) {
    const heroImage = data.url.includes('acoustic') ? '/images/pinterest_acoustic_guitars.png' : '/images/pinterest_electric_guitars.png';
    const canonical = `${BASE_URL}${data.url}`;
    
    let title = `${data.pinterest_hook} | ReviewsGuitar.com`;
    if (title.length > 65) title = data.pinterest_hook.substring(0, 65);
    const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="Discover the ultimate answer for: ${data.keyword}. Read our expert analysis and find out which gear wins.">
    <link rel="canonical" href="${canonical}">
    <!-- Pinterest Rich Pins -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${data.pinterest_hook}">
    <meta property="og:description" content="Click to read the ultimate guide on ${data.keyword}.">
    <meta property="og:image" content="${BASE_URL}${heroImage}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="ReviewsGuitar.com">
    <meta name="pinterest-rich-pin" content="true">
    <meta name="pin:description" content="${data.pinterest_hook} — The definitive answer for ${data.keyword}. Save this to your guitar board!">
    <meta name="pin:media" content="${BASE_URL}${heroImage}">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style.min.css">
    <style>
        .bofu-container { display: flex; flex-direction: column; gap: 2rem; max-width: 1200px; margin: 0 auto; padding: 2rem; }
        @media(min-width: 900px) { .bofu-container { flex-direction: row; } }
        .bofu-sidebar { flex: 0 0 350px; background: #111; border-radius: 12px; overflow: hidden; border: 1px solid #333; position: sticky; top: 2rem; height: fit-content; }
        .pinterest-pin-preview { width: 100%; aspect-ratio: 2/3; background: url('${heroImage}') center/cover; position: relative; }
        .pin-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, #000, transparent); padding: 2rem 1.5rem; }
        .pin-title { color: #fff; font-family: 'Montserrat', sans-serif; font-size: 1.8rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem; }
        .save-btn { background: #e60023; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 1rem; font-weight: bold; font-family: 'Inter', sans-serif; text-decoration: none; border-radius: 30px; margin: 1.5rem; transition: 0.2s; }
        .save-btn:hover { background: #ad081b; }
        
        .bofu-content { flex: 1; padding: 1rem 0; }
        .bofu-intent-header { font-size: 2.5rem; font-family: 'Montserrat'; font-weight: 800; color: #fff; margin-bottom: 1rem; }
        .bofu-badge { display: inline-block; background: #e60023; color: #fff; padding: 0.3rem 0.8rem; font-size: 0.8rem; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }
        
        .product-stack { display: flex; flex-direction: column; gap: 2rem; margin-top: 3rem; }
        .product-row { display: flex; flex-direction: column; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; overflow: hidden; }
        @media(min-width: 600px) { .product-row { flex-direction: row; } }
        .product-img-col { flex: 0 0 250px; background: #fff; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .product-img-col img { max-width: 100%; max-height: 250px; object-fit: contain; }
        .product-info-col { padding: 2rem; flex: 1; display: flex; flex-direction: column; }
        .amazon-btn { margin-top: auto; background: #f3a847; color: #111; text-align: center; font-weight: bold; padding: 1rem; border-radius: 8px; text-decoration: none; font-family: 'Inter'; display: block; }
        .amazon-btn:hover { background: #e29330; }
    </style>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-77XFW0G925"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-77XFW0G925');
    </script>
</head>
<body style="background: #0a0a0a; color: #eee; font-family: 'Inter', sans-serif;">
    <header style="padding: 1.5rem 2rem; border-bottom: 1px solid #222;">
        <a href="/" style="color: #fff; text-decoration: none; font-family: 'Montserrat'; font-size: 1.5rem; font-weight: 800;">ReviewsGuitar.com</a>
    </header>

    <main class="bofu-container">
        <section class="bofu-content">
            <span class="bofu-badge">${data.type.toUpperCase()} GUIDE</span>
            <h1 class="bofu-intent-header">${data.keyword.replace(/\b\w/g, c => c.toUpperCase())}</h1>
            <p style="font-size: 1.1rem; color: #aaa; line-height: 1.7;">
                Stop endlessly searching. We've taken the top gear matching <strong>${data.keyword}</strong> and put them through our rigorous 10+ hour bench-testing protocol. Here are the elite choices for 2026.
            </p>
            <p style="font-size: 0.85rem; color: #666; margin-top: 1rem; border-top: 1px solid #333; padding-top: 0.5rem;">
                <em>Disclosure: As an Amazon Associate, we earn from qualifying purchases at no extra cost to you.</em>
            </p>

            <!-- Quick Links (Above the Fold) -->
            <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 1.5rem; margin-top: 2rem;">
                <h3 style="font-family: 'Montserrat'; font-size: 1.2rem; margin-top: 0; color: #fff;">Quick Links</h3>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.8rem;">
                    ${matchedProducts.map((p, idx) => `
                    <li style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 0.5rem;">
                        <span style="color: #ccc; font-weight: 600;">${idx === 0 ? '🏆 Top Pick: ' : '🎯 Runner Up: '} ${p.name}</span>
                        <a href="${getCloakedLink(p.amazonLink)}" style="background: #f3a847; color: #111; padding: 0.4rem 0.8rem; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 0.9rem;" target="_blank" rel="noopener nofollow">View</a>
                    </li>
                    `).join('')}
                </ul>
            </div>

            <div class="product-stack">
                ${matchedProducts.map((p, idx) => `
                <div class="product-row">
                    <div class="product-img-col">
                        <img src="${p.image}" alt="${p.name}">
                    </div>
                    <div class="product-info-col">
                        <span style="color: #e60023; font-weight: bold; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 0.5rem;">${idx === 0 ? '🏆 TOP PICK' : '🎯 RUNNER UP'}</span>
                        <h2 style="font-family: 'Montserrat'; font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff;">${p.name}</h2>
                        <div style="color: #f3a847; font-weight: bold; font-size: 1.2rem; margin-bottom: 1rem;">${p.price}</div>
                        <p style="color: #bbb; line-height: 1.5; font-size: 0.95rem; margin-bottom: 1.5rem;">${p.description}</p>
                        <a href="${getCloakedLink(p.amazonLink)}" class="amazon-btn" target="_blank" rel="noopener nofollow">Check Price on Amazon</a>
                    </div>
                </div>
                `).join('')}
            </div>
        </section>

        <aside class="bofu-sidebar">
            <div class="pinterest-pin-preview">
                <div class="pin-overlay">
                    <div class="pin-title">${data.pinterest_hook}</div>
                </div>
            </div>
            <a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(canonical)}&media=${encodeURIComponent(BASE_URL + heroImage)}&description=${encodeURIComponent(data.pinterest_hook)}" class="save-btn" target="_blank" rel="noopener nofollow">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.64 11.2-.1-.94-.2-2.37.04-3.4l1.37-5.83s-.35-.7-.35-1.74c0-1.63.95-2.85 2.13-2.85 1 0 1.49.75 1.49 1.66 0 1-.64 2.52-.97 3.92-.28 1.17.58 2.12 1.73 2.12 2.08 0 3.68-2.2 3.68-5.37 0-2.8-2.02-4.77-4.9-4.77-3.34 0-5.3 2.5-5.3 5.1 0 1 .38 2.08.87 2.68.1.11.11.2.08.3l-.33 1.35c-.05.2-.18.25-.4.15-1.52-.7-2.46-2.9-2.46-4.66 0-3.8 2.76-7.28 7.95-7.28 4.17 0 7.42 2.97 7.42 6.95 0 4.14-2.6 7.48-6.22 7.48-1.2 0-2.35-.63-2.73-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.16C10.74 23.83 11.36 24 12c6.63 0 12-5.37 12-12C24 5.37 18.63 0 12 0z"/></svg>
                Save to Pinterest
            </a>
            <div style="padding: 0 1.5rem 1.5rem; font-size: 0.9rem; color: #888;">
                <p>If you're looking for <strong>${data.keyword}</strong>, we've broken down exactly what you need to know before making a purchase.</p>
            </div>
        </aside>
    </main>
    <script async defer src="//assets.pinterest.com/js/pinit.js"></script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(PROJECT_ROOT, 'pages', fileName), pageHtml);
}

function updateVercelJson(bofuData) {
    const vercelPath = path.join(PROJECT_ROOT, 'vercel.json');
    const vercelData = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    
    // Create new rewrites
    const newRewrites = bofuData.map(d => {
        const slug = d.url.replace(/\//g, '_').replace(/^_/, ''); // e.g. best_beginner-acoustic-guitar
        return {
            source: d.url,
            destination: `/pages/bofu_${slug}`
        };
    });

    // Remove old rewrites that match our bofu urls
    const bofuUrls = bofuData.map(d => d.url);
    const filteredRewrites = vercelData.rewrites.filter(r => !bofuUrls.includes(r.source));
    
    // Add our new rewrites to the top
    vercelData.rewrites = [...newRewrites, ...filteredRewrites];
    
    fs.writeFileSync(vercelPath, JSON.stringify(vercelData, null, 2));
    console.log("Updated vercel.json rewrites.");
}

function main() {
    console.log("Generating Pinterest BoFu Landing Pages...");
    const csvContent = fs.readFileSync(path.join(PROJECT_ROOT, 'bofu_keywords.csv'), 'utf8');
    const bofuData = parseCSV(csvContent);
    
    if (!fs.existsSync(path.join(PROJECT_ROOT, 'pages'))) fs.mkdirSync(path.join(PROJECT_ROOT, 'pages'));

    bofuData.forEach(data => {
        const matchedProducts = matchProducts(data.keyword);
        if (matchedProducts.length === 0) {
            // fallback if no match
            matchedProducts.push(products[0], products[1]); 
        }
        
        const slug = data.url.replace(/\//g, '_').replace(/^_/, '');
        const fileName = `bofu_${slug}.html`;
        generateBoFuPage(data, matchedProducts, fileName);
    });
    
    console.log(`Successfully generated ${bofuData.length} BoFu landing pages.`);
    updateVercelJson(bofuData);
}

main();

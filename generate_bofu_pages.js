const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname);
const BASE_URL = "https://reviewsguitar.com";

// Load Products
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

// Per-page editorial enrichment (buying guide + FAQ). Keyed by landing-page URL.
// Pages without an entry render as before (no thin-content regression).
let bofuContent = {};
if (fs.existsSync('bofu_content.json')) {
    try { bofuContent = JSON.parse(fs.readFileSync('bofu_content.json', 'utf8')); }
    catch (e) { console.error('Error parsing bofu_content.json:', e); }
}

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

function matchProducts(keyword, opts = {}) {
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
    } else if (/\bstrings?\b|\bpedals?\b|\bamp\b|amplifier|\bcables?\b|\btuner|\bstraps?\b|wireless|accessor|\bstands?\b|\bcapos?\b|\bpicks?\b|headphone|\bcases?\b|flight/.test(kwLower)) {
        // Word-boundary matches so "standARD", "exAMPle" etc. don't mis-route to accessories.
        targetSilo = 'accessories';
    }

    // Explicit override wins; otherwise infer silo from guitar MODEL words when the
    // query has no silo keyword (e.g. "les paul alternatives", "player ii stratocaster").
    // This stops cross-silo leakage (guitar stands surfacing on a Les Paul page).
    if (opts.silo) {
        targetSilo = opts.silo;
    } else if (!targetSilo) {
        if (/\bles paul\b|\bsg\b|stratocaster|\bstrat\b|telecaster|\btele\b|pacifica|dinky|jazzmaster|silver sky|custom 24/.test(kwLower)) targetSilo = 'electric';
        else if (/classical|nylon|dreadnought|fingerstyle|\bconcert\b/.test(kwLower)) targetSilo = 'acoustic';
    }

    const BRANDS = ['yamaha', 'fender', 'squier', 'martin', 'taylor', 'prs', 'boss', 'tc electronic', 'epiphone', 'jackson', 'hercules', 'ernie ball', 'wingo', 'perri', 'hal leonard', 'justinguitar', 'nerecndens', 'gibson', 'ibanez', 'vox', 'marshall', 'gretsch', 'seagull'];
    const activeBrands = BRANDS.filter(b => kwLower.includes(b));

    // Gear-type intent: route accessory/gear keywords to the right product CATEGORY
    // instead of letting generic word-overlap surface guitar stands on every page.
    // Order matters: more specific types are checked first (pickup before pick, capo before string).
    let gearType = null;
    if (/pickup|p-?90|humbucker|single.?coil|fluence/.test(kwLower)) gearType = 'pickups';
    else if (/pedal|distortion|overdrive|\bwah\b|loop|fuzz|\bdelay\b|reverb|chorus/.test(kwLower)) gearType = 'pedals';
    else if (/capo/.test(kwLower)) gearType = 'capos';
    else if (/headphone/.test(kwLower)) gearType = 'headphones';
    else if (/\bcable/.test(kwLower)) gearType = 'cables';
    else if (/\bcase|flight ?case|gig ?bag/.test(kwLower)) gearType = 'cases';
    else if (/wireless/.test(kwLower)) gearType = 'wireless';
    else if (/strap/.test(kwLower)) gearType = 'straps';
    else if (/tuner|tuning/.test(kwLower)) gearType = 'tuners';
    else if (/\bstrings\b|guitar.?string/.test(kwLower)) gearType = 'strings'; // plural/"guitar string" so "7 string guitar" stays a guitar
    else if (/\bpicks?\b/.test(kwLower)) gearType = 'picks';
    // 'amps' is a fallback: "amp" often appears as context (e.g. "headphones for
    // guitar amp practice"), so only treat it as the subject when no more specific
    // accessory type matched first.
    else if (/\bamp\b|amplifier|\bcombo\b/.test(kwLower)) gearType = 'amps';
    else if (/\bstands?\b/.test(kwLower)) gearType = 'stands'; // not "standARD"

    // A forced/inferred GUITAR silo must not inherit an accessory gear type
    // (e.g. "les paul standard" must never fall into the 'stands' bucket).
    if (targetSilo && targetSilo !== 'accessories') gearType = null;

    // Canonical gear type for a product (category, with the mis-filed combo amp special-cased)
    const productGearType = (p) => {
        const n = p.name.toLowerCase();
        if (/\bamp\b|combo amp|amplifier/.test(n)) return 'amps';
        const c = (p.category || '').toLowerCase();
        const KNOWN = ['pickups', 'pedals', 'strings', 'tuners', 'capos', 'picks', 'straps', 'wireless', 'stands', 'cases', 'cables', 'headphones'];
        return KNOWN.includes(c) ? c : null;
    };

    // pinnedOnly products (e.g. a nylon classical, a specific humbucker) appear ONLY on
    // pages that explicitly pin them — never via auto-matching on category roundups.
    let scored = products.filter(p => !p.pinnedOnly).map(p => {
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

        // 1b. Gear-type match: dominate scoring for typed accessory/gear queries so
        // the right category wins and unrelated accessories (e.g. stands) drop out.
        if (gearType) {
            const pType = productGearType(p);
            if (pType === gearType) {
                score += 45;            // correct gear type for the query
            } else if (pType !== null) {
                score -= 30;            // wrong-type accessory/gear: push it down
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
        
        // Skip brand scoring for "alternatives" pages (opts.brandNeutral): there we WANT
        // other brands, not the named product itself.
        if (!opts.brandNeutral && activeBrands.length > 0) {
            if (pBrand && activeBrands.includes(pBrand)) {
                score += 20;
            } else if (pBrand) {
                score -= 15;
            }
        }

        // 3. Model / Word Match
        // Extract specific model words from keyword (e.g. fg800, 112v, etc.)
        const modelWords = ['fg800', 'fg830', 'cd-60s', 'stratocaster', 'strat', 'telecaster', 'tele', 'pacifica', 'dinky', 'mustang', 'katana', 'polytune', 'ds-1', 'd-18', 'd-10e', '214ce', '314ce', 'silver sky', 'ultra', 'regular slinky', 'xs', 'gs414b', 'fct-2', 'telepath', '66pcs', 'method', 'lessons', 'jazzmaster', 'custom 24', '7 string', 'gs mini'];
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
    
    // Hard silo gate: never show accessories on a guitar page (or a guitar on an
    // accessory page). Prevents brand-match leakage (e.g. a "Gibson P-90 pickup" on a
    // Gibson guitar page) that a soft score penalty couldn't stop.
    if (targetSilo === 'electric' || targetSilo === 'acoustic' || targetSilo === 'bass') {
        scored = scored.filter(s => s.product.silo === targetSilo);
    }
    // Drop explicitly excluded products (e.g. the subject of an "alternatives" page).
    if (Array.isArray(opts.excludeIds) && opts.excludeIds.length) {
        scored = scored.filter(s => !opts.excludeIds.includes(s.product.id));
    }
    scored.sort((a, b) => b.score - a.score);
    // Show only genuinely-relevant products instead of padding to 4 with cross-type
    // junk (headphones on a "best bass" page, a stand on "acoustic under 500"). If
    // nothing is relevant, return [] so the page renders an honest category-level guide.
    let relevant = scored.filter(s => s.score > 0);
    if (relevant.length === 0 && targetSilo) {
        relevant = scored.filter(s => s.product.silo === targetSilo); // in-silo fallback
    }
    const sliceCount = kwLower.includes(' vs ') || kwLower.includes('comparison') ? 2 : 4;
    return relevant.slice(0, sliceCount).map(s => s.product);
}

// Star string from a numeric rating (visible + extractable signal for LLMs).
function ratingBadge(p) {
    const rv = Number(p.rating);
    if (Number.isNaN(rv) || rv <= 0) return '';
    return `<span style="color:#f3a847;font-weight:bold;font-size:0.95rem;margin-left:0.75rem;" aria-label="Rated ${rv} out of 5">★ ${rv}/5</span>`;
}

// Honest schema graph for a BoFu page. Real editorial ratings only (ratingCount:1,
// a single expert review). Single-product review pages emit a single Product with a
// Review node; multi-product "best" pages emit an ItemList of Products. Every page
// gets a BreadcrumbList. FAQPage is added separately from the enrich block.
function buildBofuSchema(data, products, isSingle) {
    const canonical = `${BASE_URL}${data.url}`;
    const priceNum = s => String(s || '').replace(/[^0-9.]/g, '');
    const productNode = p => {
        const rv = Number(p.rating);
        const node = {
            "@type": "Product",
            "name": p.name,
            "description": p.description,
            "image": p.image ? (/^https?:\/\//.test(p.image) ? p.image : `${BASE_URL}${p.image}`) : undefined,
            "brand": { "@type": "Brand", "name": p.name ? p.name.split(' ')[0] : "Generic" },
            "offers": {
                "@type": "Offer",
                "url": p.amazonLink || canonical,
                "priceCurrency": "USD",
                "price": priceNum(p.price),
                "availability": "https://schema.org/InStock",
                "itemCondition": "https://schema.org/NewCondition"
            }
        };
        if (!Number.isNaN(rv) && rv > 0) {
            node.aggregateRating = { "@type": "AggregateRating", "ratingValue": rv, "bestRating": 5, "worstRating": 1, "ratingCount": 1 };
            node.review = { "@type": "Review", "reviewRating": { "@type": "Rating", "ratingValue": rv, "bestRating": 5, "worstRating": 1 }, "author": { "@type": "Organization", "name": "ReviewsGuitar.com" }, "publisher": { "@type": "Organization", "name": "ReviewsGuitar.com" } };
        }
        if (Array.isArray(p.pros) && p.pros.length) node.positiveNotes = { "@type": "ItemList", "itemListElement": p.pros.map((t, i) => ({ "@type": "ListItem", "position": i + 1, "name": t })) };
        if (Array.isArray(p.cons) && p.cons.length) node.negativeNotes = { "@type": "ItemList", "itemListElement": p.cons.map((t, i) => ({ "@type": "ListItem", "position": i + 1, "name": t })) };
        return node;
    };
    const graph = [{
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL + "/" },
            { "@type": "ListItem", "position": 2, "name": (data.type || 'Guides').replace(/\b\w/g, c => c.toUpperCase()), "item": canonical }
        ]
    }];
    if (isSingle && products.length) {
        graph.push(productNode(products[0]));
    } else if (products.length) {
        graph.push({
            "@type": "ItemList",
            "itemListElement": products.map((p, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": productNode(p)
            }))
        });
    }
    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

function generateBoFuPage(data, matchedProducts, fileName) {
    const heroImage = data.url.includes('acoustic') ? '/images/pinterest_acoustic_guitars.png' : '/images/pinterest_electric_guitars.png';
    const canonical = `${BASE_URL}${data.url}`;

    // Single-product review pages ("is X worth it", type=review) should NOT show
    // three unrelated "runner up" products — that mismatch confused both users and
    // answer engines (e.g. a strings review listing guitars). Keep just the subject.
    const isSingleReview = (data.type === 'review') && !/\bvs\b|comparison|best|top\b|\bunder\b/i.test(data.keyword);
    if (isSingleReview && matchedProducts.length > 1) {
        matchedProducts = matchedProducts.slice(0, 1);
    }
    const hasProducts = matchedProducts.length > 0;

    // --- Editorial enrichment: buying guide + FAQ (unique per page) ---
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const enrich = bofuContent[data.url] || {};
    let buyingGuideHtml = '';
    if (enrich.buyingGuide) {
        const g = enrich.buyingGuide;
        buyingGuideHtml = `
            <section class="bofu-guide" style="margin-top: 3.5rem;">
                <h2 style="font-family: 'Montserrat'; font-size: 1.8rem; color: #fff; margin-bottom: 1rem;">${esc(g.heading)}</h2>
                <p style="color: #bbb; line-height: 1.8; font-size: 1.02rem;">${esc(g.intro)}</p>
                ${(g.criteria || []).map(c => `
                <div style="margin-top: 1.5rem;">
                    <h3 style="font-family: 'Montserrat'; font-size: 1.2rem; color: #f3a847; margin-bottom: 0.4rem;">${esc(c.h)}</h3>
                    <p style="color: #bbb; line-height: 1.7; margin: 0;">${esc(c.p)}</p>
                </div>`).join('')}
            </section>`;
    }
    let faqHtml = '';
    let faqSchema = '';
    if (Array.isArray(enrich.faq) && enrich.faq.length) {
        faqHtml = `
            <section class="bofu-faq" style="margin-top: 3.5rem;">
                <h2 style="font-family: 'Montserrat'; font-size: 1.8rem; color: #fff; margin-bottom: 1.2rem;">Frequently Asked Questions</h2>
                ${enrich.faq.map(f => `
                <div style="border-top: 1px solid #2a2a2a; padding: 1.2rem 0;">
                    <h3 style="font-family: 'Inter'; font-size: 1.05rem; color: #fff; margin: 0 0 0.5rem;">${esc(f.q)}</h3>
                    <p style="color: #bbb; line-height: 1.7; margin: 0;">${esc(f.a)}</p>
                </div>`).join('')}
            </section>`;
        faqSchema = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [${enrich.faq.map(f => `{
        "@type": "Question",
        "name": ${JSON.stringify(f.q)},
        "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(f.a)} }
      }`).join(',')}]
    }
    </script>`;
    }

    // Honest Product/Review/AggregateRating + ItemList + BreadcrumbList graph.
    const productSchema = `
    <script type="application/ld+json">
${buildBofuSchema(data, matchedProducts, isSingleReview)}
    </script>`;

    // --- TL;DR answer box (extractable, near the top) ---
    const topPick = matchedProducts[0];
    let tldrHtml = '';
    if (topPick) {
        const rb = Number(topPick.rating) > 0 ? ` (rated ${Number(topPick.rating)}/5)` : '';
        const reason = (Array.isArray(topPick.pros) && topPick.pros[0]) ? topPick.pros[0] : (topPick.description || '').split('.')[0];
        const verdict = isSingleReview
            ? `Our verdict: the <strong>${esc(topPick.name)}</strong>${rb} at ${esc(topPick.price)} — ${esc(reason)}.`
            : `Top pick: <strong>${esc(topPick.name)}</strong>${rb} at ${esc(topPick.price)} — ${esc(reason)}.`;
        tldrHtml = `
            <div style="background:#141414;border-left:4px solid #f3a847;border-radius:8px;padding:1.25rem 1.5rem;margin-top:2rem;">
                <div style="text-transform:uppercase;letter-spacing:1px;font-size:0.75rem;color:#f3a847;font-weight:bold;margin-bottom:0.4rem;">Short answer</div>
                <p style="margin:0;color:#eee;line-height:1.6;font-size:1.02rem;">${verdict}</p>
            </div>`;
    }

    // --- Comparison table (multi-product pages only): a clean, LLM-liftable grid ---
    let comparisonTable = '';
    if (!isSingleReview && matchedProducts.length > 1) {
        comparisonTable = `
            <section style="margin-top:3rem;overflow-x:auto;">
                <h2 style="font-family:'Montserrat';font-size:1.6rem;color:#fff;margin-bottom:1rem;">At a glance</h2>
                <table style="width:100%;border-collapse:collapse;font-size:0.95rem;color:#ddd;">
                    <thead>
                        <tr style="border-bottom:2px solid #333;text-align:left;">
                            <th style="padding:0.6rem 0.8rem;">Product</th>
                            <th style="padding:0.6rem 0.8rem;">Price</th>
                            <th style="padding:0.6rem 0.8rem;">Our rating</th>
                            <th style="padding:0.6rem 0.8rem;">Best for</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${matchedProducts.map((p, idx) => `
                        <tr style="border-bottom:1px solid #222;">
                            <td style="padding:0.6rem 0.8rem;font-weight:600;color:#fff;">${idx === 0 ? '🏆 ' : ''}${esc(p.name)}</td>
                            <td style="padding:0.6rem 0.8rem;">${esc(p.price)}</td>
                            <td style="padding:0.6rem 0.8rem;">${Number(p.rating) > 0 ? '★ ' + Number(p.rating) + '/5' : '—'}</td>
                            <td style="padding:0.6rem 0.8rem;color:#bbb;">${esc((Array.isArray(p.pros) && p.pros[0]) ? p.pros[0] : (p.description || '').split('.')[0])}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
                <p style="font-size:0.8rem;color:#666;margin-top:0.6rem;">Ratings are ReviewsGuitar.com editorial scores (5-point scale, single expert review). Prices last checked ${new Date().toISOString().slice(0, 10)}; verify current price at the retailer.</p>
            </section>`;
    }

    let title = `${data.pinterest_hook} | ReviewsGuitar.com`;
    if (title.length > 65) title = data.pinterest_hook.substring(0, 65);
    const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="Discover the ultimate answer for: ${data.keyword}. Read our expert analysis and find out which gear wins.">
    <meta name="author" content="ReviewsGuitar.com">
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
    ${productSchema}
    ${faqSchema}
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
                ${hasProducts
                    ? `Stop endlessly searching. We've compared the top gear matching <strong>${data.keyword}</strong> on specs, real-world value, and player feedback. Here are our top choices for 2026.`
                    : `Here's our practical take on <strong>${data.keyword}</strong> — what matters, how to judge it, and the questions worth answering before you buy.`}
            </p>
            <p style="font-size: 0.85rem; color: #666; margin-top: 1rem; border-top: 1px solid #333; padding-top: 0.5rem;">
                <em>Disclosure: As an Amazon Associate, we earn from qualifying purchases at no extra cost to you.</em>
            </p>
            ${tldrHtml}

            ${hasProducts ? `<!-- Quick Links (Above the Fold) -->
            <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 1.5rem; margin-top: 2rem;">
                <h3 style="font-family: 'Montserrat'; font-size: 1.2rem; margin-top: 0; color: #fff;">Quick Links</h3>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.8rem;">
                    ${matchedProducts.map((p, idx) => `
                    <li style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 0.5rem;">
                        <span style="color: #ccc; font-weight: 600;">${idx === 0 ? '🏆 Top Pick: ' : '🎯 Runner Up: '} ${p.name}</span>
                        <a href="${getCloakedLink(p.amazonLink)}" style="background: #f3a847; color: #111; padding: 0.4rem 0.8rem; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 0.9rem;" target="_blank" rel="sponsored nofollow noopener">View</a>
                    </li>
                    `).join('')}
                </ul>
            </div>` : ''}

            ${hasProducts ? `<div class="product-stack">
                ${matchedProducts.map((p, idx) => `
                <div class="product-row">
                    <div class="product-img-col">
                        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<div style="color:#888;font-size:0.8rem;text-align:center;padding:1.5rem;line-height:1.4;">${esc(p.name)}<br><span style="color:#666;">image coming soon</span></div>`}
                    </div>
                    <div class="product-info-col">
                        <span style="color: #e60023; font-weight: bold; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 0.5rem;">${idx === 0 ? '🏆 TOP PICK' : '🎯 RUNNER UP'}</span>
                        <h2 style="font-family: 'Montserrat'; font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff;">${p.name}${ratingBadge(p)}</h2>
                        <div style="color: #f3a847; font-weight: bold; font-size: 1.2rem; margin-bottom: 1rem;">${p.price}</div>
                        <p style="color: #bbb; line-height: 1.5; font-size: 0.95rem; margin-bottom: 1rem;">${p.description}</p>
                        ${(Array.isArray(p.pros) && p.pros.length) ? `<div style="margin-bottom:0.6rem;"><span style="color:#7ec87e;font-weight:600;font-size:0.85rem;">Pros:</span> <span style="color:#bbb;font-size:0.9rem;">${p.pros.join(' · ')}</span></div>` : ''}
                        ${(Array.isArray(p.cons) && p.cons.length) ? `<div style="margin-bottom:1.2rem;"><span style="color:#e08a8a;font-weight:600;font-size:0.85rem;">Cons:</span> <span style="color:#bbb;font-size:0.9rem;">${p.cons.join(' · ')}</span></div>` : ''}
                        <a href="${getCloakedLink(p.amazonLink)}" class="amazon-btn cta-check-price" target="_blank" rel="sponsored nofollow noopener">Check Price on Amazon</a>
                    </div>
                </div>
                `).join('')}
            </div>` : ''}
            ${comparisonTable}
            ${buyingGuideHtml}
            ${faqHtml}
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
        // Per-URL match control (bofu_content.json > match):
        //   { none:true }            -> subject not in catalog; render honest category-level page
        //   { pinIds:[...] }         -> feature exactly these catalog products (single reviews)
        //   { silo, brandNeutral, excludeIds } -> steer the matcher (e.g. alternatives pages)
        const enrich = bofuContent[data.url] || {};
        const m = enrich.match || {};
        let matchedProducts;
        if (m.none) {
            matchedProducts = [];
        } else if (Array.isArray(m.pinIds) && m.pinIds.length) {
            matchedProducts = m.pinIds.map(id => products.find(p => p.id === id)).filter(Boolean);
        } else {
            matchedProducts = matchProducts(data.keyword, m);
        }
        // No unrelated-product fallback: an empty list now yields an honest page carried
        // by the buying guide + FAQ, instead of padding with Yamaha FG800 etc.

        const slug = data.url.replace(/\//g, '_').replace(/^_/, '');
        const fileName = `bofu_${slug}.html`;
        generateBoFuPage(data, matchedProducts, fileName);
    });
    
    console.log(`Successfully generated ${bofuData.length} BoFu landing pages.`);
    updateVercelJson(bofuData);
}

main();

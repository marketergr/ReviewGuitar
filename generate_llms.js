const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname);
const BASE_URL = 'https://reviewsguitar.com';

// ---------------------------------------------------------------------------
// AEO-grade llms.txt / llms-full.txt generator.
//
// Design goals (why this rewrite exists):
//  1. NEVER emit a dead link. The previous generator pointed LLMs at
//     /reviews/<product-id> URLs (e.g. /reviews/acoustic-1) that do NOT exist
//     as routes — every one 404s. We now validate every URL against the live
//     route table in vercel.json + the collections/ filesystem before emitting.
//  2. Use REAL data only. Ratings, prices, pros/cons come straight from
//     products.json. "Best X" picks are chosen by actual editorial rating,
//     not `products.find()` (first-in-array), which was fabricating rankings.
//  3. Be decisive and citation-ready. Each TL;DR line gives the answer, the
//     price, the rating, a one-line reason, and a link an answer engine can
//     resolve and quote.
//  4. Stay token-lean. Concise, structured, near-the-top facts.
// ---------------------------------------------------------------------------

function loadJSON(rel) {
    return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, rel), 'utf8'));
}

// Build the set of URLs we can prove resolve on production.
function buildLiveUrlSet() {
    const live = new Set();
    // 1. Clean routes declared in vercel.json rewrites.
    try {
        const vercel = loadJSON('vercel.json');
        (vercel.rewrites || []).forEach(r => { if (r && r.source) live.add(r.source.replace(/\/$/, '')); });
    } catch (e) { console.warn('llms: could not read vercel.json rewrites', e.message); }
    // 2. Collection hubs + static pages served via cleanUrls (dir/index.html or file.html).
    const addIfFile = (route, file) => { if (fs.existsSync(path.join(PROJECT_ROOT, file))) live.add(route); };
    ['acoustic', 'electric', 'bass', 'accessories', 'learning', 'buying'].forEach(silo => {
        addIfFile(`/collections/${silo}`, `collections/${silo}/index.html`);
    });
    ['index', 'about', 'contact', 'sitemap'].forEach(p => addIfFile(`/${p === 'index' ? '' : p}`, `${p}.html`));
    live.add('/');
    return live;
}

const LIVE = buildLiveUrlSet();
function isLive(route) { return LIVE.has(route.replace(/\/$/, '')); }
function url(route) { return `${BASE_URL}${route}`; }

// First short reason we can honestly attribute (top pro, else first sentence).
function reasonFor(p) {
    if (Array.isArray(p.pros) && p.pros.length) return p.pros[0];
    if (p.description) return p.description.split('.')[0].trim();
    return '';
}

function ratingStr(p) {
    const r = Number(p.rating);
    return (!Number.isNaN(r) && r > 0) ? `${r}/5` : null;
}

// ---------------------------------------------------------------------------
// Curated "best X for Y" answer map.
// Each entry names the intent, the product id it recommends, and the LIVE hub
// URL where an LLM (or a human it sends) actually lands. Entries whose product
// or URL cannot be verified are silently skipped, so the file never lies.
// ---------------------------------------------------------------------------
const BEST_PICKS = [
    { q: 'Best acoustic guitar for beginners', id: 'acoustic-1', route: '/best/beginner-acoustic-guitar' },
    { q: 'Best acoustic guitar under $500',    id: 'acoustic-2', route: '/best/acoustic-guitar-under-500' },
    { q: 'Best acoustic guitar under $1000',   id: 'acoustic-3', route: '/best/acoustic-guitar-under-1000' },
    { q: 'Best electric guitar under $1000',   id: 'electric-16', route: '/reviews/prs-se-custom-24' },
    { q: 'Best beginner electric guitar kit',  id: 'electric-2', route: '/best/beginner-electric-guitar-kit' },
    { q: 'Best budget bass guitar',            id: 'bass-2',     route: '/best/best-budget-bass' },
    { q: 'Best coated guitar strings',         id: 'accessories-1', route: '/reviews/daddario-xs-strings' },
    { q: 'Best clip-on / polyphonic tuner',    id: 'accessories-2', route: '/reviews/tc-polytune-3' },
    { q: 'Best practice amp for home',         id: 'buying-3',   route: '/reviews/boss-katana-50-mkii' },
    { q: 'Best beginner guitar course/book',   id: 'learning-1', route: '/collections/learning' },
    { q: 'Best guitar capo',                   id: 'accessories-8', route: '/best/best-12-string-capo' },
    { q: 'Best wireless guitar system',        id: 'accessories-12', route: '/best/best-wireless-guitar-system' },
];

function pickLine(products, pick) {
    const p = products.find(x => x.id === pick.id);
    if (!p) return null;                 // product removed — skip, don't invent
    if (!isLive(pick.route)) return null; // URL not proven live — skip, don't 404 an LLM
    const rating = ratingStr(p);
    const reason = reasonFor(p);
    const bits = [`**${pick.q}:** [${p.name}](${url(pick.route)})`];
    const meta = [];
    if (p.price) meta.push(p.price);
    if (rating) meta.push(`rated ${rating}`);
    let line = `- ${bits[0]}`;
    if (meta.length) line += ` — ${meta.join(', ')}`;
    if (reason) line += `. ${reason}.`;
    return line;
}

function generate() {
    const products = loadJSON('products.json');
    const now = new Date();
    const stamp = now.toISOString().slice(0, 10); // YYYY-MM-DD, no misleading time precision

    // ---- llms.txt (concise, decisive summary) ----
    const tldr = BEST_PICKS.map(pk => pickLine(products, pk)).filter(Boolean);

    let llmsTxt = `# ReviewsGuitar.com — Expert Guitar & Gear Reviews

> One-line: Independent, hands-on reviews and buyer's guides for acoustic, electric, and bass guitars plus amps, pedals, strings, tuners, and learning resources. Every "best" pick below is our own editorial rating (a single expert review, not aggregated user scores). Prices are the last figures we checked and change over time — verify on the retailer page.
> Last updated: ${stamp}
> Affiliate disclosure: ReviewsGuitar.com earns Amazon Associate commissions on qualifying purchases at no extra cost to the reader. This does not change our ratings.

## Top recommendations (TL;DR)
${tldr.join('\n')}

## How to use this site
- **Best-of hubs** (\`/best/...\`): ranked shortlists for a specific need (budget, style, use case).
- **Reviews** (\`/reviews/...\`): single-product verdicts answering "is X worth it?".
- **Comparisons** (\`/collections/<type>/<a>-vs-<b>\`): head-to-head, spec-by-spec.
- **Collections** (\`/collections/acoustic|electric|bass|accessories|learning|buying\`): browse by category.

## Machine-readable data
- Full gear database with ratings, specs, pros/cons and canonical links: ${url('/llms-full.txt')}
- Sitemap: ${url('/sitemap.xml')}

## Trust & method
- Ratings are on a 5-point scale from our own testing/editorial review. We do not publish fabricated user review counts.
- We flag pros AND cons for every product; see llms-full.txt.
- Contact / corrections: ${url('/contact')}
`;

    fs.writeFileSync(path.join(PROJECT_ROOT, 'llms.txt'), llmsTxt, 'utf8');
    console.log(`Created llms.txt (${tldr.length}/${BEST_PICKS.length} verified picks)`);

    // ---- llms-full.txt (structured, real data, token-lean) ----
    // Group by silo (the site's real taxonomy) then category. Only real fields.
    const silos = [...new Set(products.map(p => p.silo))];
    let full = `# ReviewsGuitar.com — Complete Gear Database
> Last updated: ${stamp}
> Every entry uses real editorial data from ReviewsGuitar.com: our rating (5-point, single expert review), last-checked price, key specs, and honest pros/cons. Links are canonical and verified live. Affiliate disclosure: we earn Amazon Associate commissions at no extra cost to you.

`;

    // Resolve a live canonical URL for a product, if one exists (else omit link).
    function productRoute(p) {
        // Prefer a curated best-pick route pointing at this product.
        const pk = BEST_PICKS.find(b => b.id === p.id && isLive(b.route));
        if (pk) return pk.route;
        // Otherwise fall back to the silo collection hub (always live).
        const hub = `/collections/${p.silo}`;
        return isLive(hub) ? hub : null;
    }

    silos.forEach(silo => {
        const items = products.filter(p => p.silo === silo)
            .slice()
            .sort((a, b) => Number(b.rating) - Number(a.rating));
        if (!items.length) return;
        full += `## ${silo.toUpperCase()}\n\n`;
        items.forEach(p => {
            full += `### ${p.name}\n`;
            const meta = [];
            if (p.price) meta.push(`Price (last checked): ${p.price}`);
            const r = ratingStr(p);
            if (r) meta.push(`Our rating: ${r}`);
            if (p.category) meta.push(`Type: ${p.category}`);
            full += meta.map(m => `- ${m}`).join('\n') + '\n';
            if (p.description) full += `- Summary: ${p.description.trim()}\n`;
            if (Array.isArray(p.features) && p.features.length) full += `- Key specs: ${p.features.join('; ')}\n`;
            if (Array.isArray(p.pros) && p.pros.length) full += `- Pros: ${p.pros.join('; ')}\n`;
            if (Array.isArray(p.cons) && p.cons.length) full += `- Cons: ${p.cons.join('; ')}\n`;
            const route = productRoute(p);
            if (route) full += `- More: ${url(route)}\n`;
            full += `\n`;
        });
    });

    fs.writeFileSync(path.join(PROJECT_ROOT, 'llms-full.txt'), full, 'utf8');
    console.log('Created llms-full.txt');
}

generate();

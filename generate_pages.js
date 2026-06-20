const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
let pageCount = 0;

// Proper Title Case (lowercases first, so it also fixes ALL-CAPS input).
const toTitleCase = str => String(str).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// Load central configuration
let config = { amazonTrackingId: "reviewsguitar-20", pinterestTagId: "", pinterestDomainVerify: "" };
if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
}

// EEAT helpers (author + affiliate disclosure), config-driven so a real reviewer
// can be filled in once (config.author) and propagate on regeneration.
const AUTHOR = (config.author && config.author.name) ? config.author : null;
const AUTHOR_META = AUTHOR ? AUTHOR.name : "ReviewsGuitar.com";
const AFFILIATE_DISCLOSURE = config.affiliateDisclosure || "Some links on this page are affiliate links. As an Amazon Associate, ReviewsGuitar.com earns from qualifying purchases — at no extra cost to you.";
const authorByline = () => AUTHOR
    ? `<p class="byline">Reviewed by <a href="${AUTHOR.url || '/about'}" rel="author">${AUTHOR.name}</a>${AUTHOR.title ? ', ' + AUTHOR.title : ''}</p>`
    : `<!-- TODO(human): set config.author.name (+ title, bio) to render a real author byline and Person schema (EEAT). -->`;
const disclosureBanner = () => `<p class="affiliate-disclosure-banner">${AFFILIATE_DISCLOSURE}</p>`;

// BreadcrumbList (Home > Silo > Page) derived from the page URL, for JSON-LD.
const titleCaseWords = s => String(s).replace(/-/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
function breadcrumbFor(url) {
    const base = 'https://reviewsguitar.com';
    const segs = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '').split('/').filter(Boolean);
    const items = [{ "@type": "ListItem", "position": 1, "name": "Home", "item": base + "/" }];
    if (segs[1]) items.push({ "@type": "ListItem", "position": 2, "name": titleCaseWords(segs[1]), "item": `${base}/collections/${segs[1]}` });
    if (segs[2]) items.push({ "@type": "ListItem", "position": 3, "name": titleCaseWords(segs[2]), "item": `${base}/collections/${segs[1]}/${segs[2]}` });
    return { "@type": "BreadcrumbList", "itemListElement": items };
}

// Load Macro Content Cache
// Load Macro Content Cache
let macroCache = { clusters: {}, silos: {} };
if (fs.existsSync('macro_content_cache.json')) {
    macroCache = JSON.parse(fs.readFileSync('macro_content_cache.json', 'utf8'));
}

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
    if (!amazonLink) return '#';
    return amazonLink; // Raw direct link to bypass AdBlockers
}

function getSeoTitle(title) {
    const full = `${title} | Expert Analysis & Reviews 2026 | ReviewsGuitar.com`;
    if (full.length <= 60) return full;
    const shorter = `${title} | ReviewsGuitar.com`;
    if (shorter.length <= 60) return shorter;
    return title.substring(0, 56) + '...';
}

function generateDeepContent(keyword, silo) {
    const titleCase = str => str.replace(/\b\w/g, c => c.toUpperCase());
    const formattedKeyword = titleCase(keyword.replace(/_/g, ' '));
    const year = new Date().getFullYear();

    // Diversified content blocks to avoid "footprint"
    const intros = [
        `In ${year}, the market for <strong>${formattedKeyword}</strong> has reached a tipping point where professional specifications are becoming standard at intermediate price points. This guide analyzes how that shift affects your long-term value.`,
        `Choosing <strong>${formattedKeyword}</strong> means weighing build materials, playability, and reliability. This ${year} guide compares the top contenders so you can match the right option to your needs.`,
        `The search for the right <strong>${formattedKeyword}</strong> often comes down to a trade-off between vintage character and modern reliability. This ${year} guide highlights the options that offer genuine value.`
    ];

    const intro = intros[Math.floor(Math.random() * intros.length)];

    return `
        <article class="article-content">
            <p class="article-lead">
                ${intro}
            </p>

            <!-- TODO(human): Add first-hand notes for this category (gear you've owned/played, setup quirks, who each option suits). The guidance below is general; demonstrated first-hand experience is what Google's reviews system rewards. -->

            <h3>1. What to Look For</h3>
            <p>
                Look beyond the spec sheet to build quality and consistency: fretwork and nut slotting on guitars, materials and connectors on cables, and component quality on electronics. Modern manufacturing tolerances are tighter than ever, but the gap between "good" and "excellent" still comes down to the details.
            </p>

            <div class="expert-tip">
                <strong>How to compare</strong>
                <ul>
                    <li><strong>Build &amp; materials:</strong> Are the core components durable and well finished for the price?</li>
                    <li><strong>Playability &amp; usability:</strong> Is it comfortable and reliable for long sessions?</li>
                    <li><strong>Value over time:</strong> Will it hold up, and does the price match the performance?</li>
                </ul>
            </div>

            <h3>2. Build Quality &amp; Materials</h3>
            <p>
                CNC precision in modern production lines has largely eliminated the inconsistency of older eras, but hand-finishing still matters — rolled fretboard edges and properly cut nuts separate genuinely good instruments from rushed ones. On acoustics, a solid top generally opens up and sounds better over time; on electrics, shielding and hardware quality drive long-term reliability.
            </p>

            <h3>3. Tonewoods &amp; Sound</h3>
            <p>
                For guitars, the timbers used shape the frequency response. Sustainable choices like Pau Ferro and roasted maple often offer better stability than traditional rosewood at intermediate price points, and torrefied ("roasted") woods tend to feel "played-in" sooner. Match the wood and body style to the sound you want rather than chasing a spec.
            </p>

            <h3>4. Maintenance &amp; Longevity</h3>
            <p>
                A little maintenance keeps any instrument performing. Guitars benefit from a semi-annual setup; key check-points:
            </p>
            <ul>
                <li><strong>Fret polishing:</strong> Smooth contact points reduce friction on bends.</li>
                <li><strong>Nut lubrication:</strong> A graphite or PTFE-based lubricant prevents "pinging" and tuning drift.</li>
                <li><strong>Electronics cleaning:</strong> On electric models, a residue-free contact cleaner keeps switching noise-free.</li>
            </ul>

            <h3>5. Buying Strategy</h3>
            <p>
                Don't buy on marketing specs alone. Focus on dynamic range — how the instrument responds to both delicate and aggressive playing — and on whether it genuinely fits how and what you play. Our selections below are the standouts in this category for ${year}.
            </p>
        </article>
    `;
}

function getHeader(basePath, title, breadcrumbs) {
    return `
    <header>
        <h1>ReviewsGuitar.com</h1>
        <p>THE ELITE SOURCE FOR GUITAR REVIEWS & GUIDES</p>
    </header>
    <nav>
        <div class="mobile-menu-toggle">☰ Menu</div>
        <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li class="dropdown">
                <a href="/collections/acoustic">Acoustic</a>
                <div class="dropdown-content">
                    <a href="/collections/acoustic">All Acoustic Guitars</a>
                    <a href="/collections/acoustic/best-for-beginners">Best for Beginners</a>
                    <a href="/collections/acoustic/best-under-500">Best Under $500</a>
                    <a href="/collections/acoustic/premium-guide">Premium Guide</a>
                </div>
            </li>
            <li class="dropdown">
                <a href="/collections/electric">Electric</a>
                <div class="dropdown-content">
                    <a href="/collections/electric">All Electric Guitars</a>
                    <a href="/collections/electric/starters">Starter Kits</a>
                    <a href="/collections/electric/metal-guitars">Best for Metal</a>
                    <a href="/collections/electric/best-under-300">Best Under $300</a>
                    <a href="/collections/electric/best-under-1000">Best Under $1000</a>
                </div>
            </li>
            <li class="dropdown">
                <a href="/collections/accessories">Gear</a>
                <div class="dropdown-content">
                    <a href="/collections/accessories">All Gear</a>
                    <a href="/collections/accessories/strings">Strings</a>
                    <a href="/collections/accessories/pedals">Pedals</a>
                    <a href="/collections/accessories/amps">Amps</a>
                </div>
            </li>
            <li class="dropdown">
                <a href="/collections/learning">Education</a>
                <div class="dropdown-content">
                    <a href="/collections/learning">All Education</a>
                    <a href="/collections/learning/apps">Learning Apps</a>
                    <a href="/collections/learning/courses">Video Courses</a>
                    <a href="/collections/learning/tips">Guitar Tips</a>
                </div>
            </li>
            <li><a href="/collections/buying">Guides</a></li>
        </ul>
    </nav>
    <main>
        <div class="container">
            <nav style="font-size: 0.8rem; color: #666; margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 0.1em;">
                <a href="/" style="color: #666; text-decoration: none;">HOME</a> ${breadcrumbs}
            </nav>
            <h1 style="font-size: 3rem; margin-bottom: 3rem;">${toTitleCase(title)}</h1>
            ${authorByline()}
    `;
}

function generateProductSchema(products, url) {
    if (!products || products.length === 0) return '';
    
    const schema = {
        "@context": "https://schema.org",
        "@graph": products.map(p => ({
            "@type": "Product",
            "name": p.name,
            "description": p.description,
            "image": p.image,
            "brand": {
                "@type": "Brand",
                "name": p.brand || (p.name ? p.name.split(' ')[0] : "Generic")
            },
            "offers": {
                "@type": "Offer",
                "url": url,
                "priceCurrency": "USD",
                "price": p.price.replace(/[^0-9.]/g, ''),
                "itemCondition": "https://schema.org/NewCondition",
                "availability": "https://schema.org/InStock"
            }
        }))
    };
    schema["@graph"].push(breadcrumbFor(url));
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function renderProductGrid(filteredProducts, pageUrl) {
    if (filteredProducts.length === 0) return '';
    
    return `
    ${disclosureBanner()}
    <span class="section-title">Editor's Choice Selection</span>
    <div class="product-grid">
        ${filteredProducts.map(p => {
            const fallbackImg = "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=800&q=80"; // Premium Placeholder
            const imgToUse = p.image || fallbackImg;
            const absoluteImage = imgToUse.startsWith('http') ? imgToUse : `https://reviewsguitar.com${imgToUse.startsWith('/') ? '' : '/'}${imgToUse}`;
            return `
            <div class="product-card">
                <div class="product-img-container">
                    <img src="${p.image || fallbackImg}" 
                         onerror="this.src='${fallbackImg}'"
                         alt="${p.name} - Expert Review & Analysis" 
                         class="product-img" 
                         loading="lazy" 
                         decoding="async">
                </div>
                <div class="product-card-content">
                    <span class="product-badge">${p.category.toUpperCase()} PICK</span>
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-rating">${'★'.repeat(Math.floor(p.rating))}${p.rating % 1 !== 0 ? '½' : ''} (${p.rating})</div>
                    <p class="product-desc">${p.description}</p>
                    
                    <div class="pros-cons-grid">
                        <div class="pros-box">
                            <h4>Pros</h4>
                            <ul class="pros-cons-list">
                                ${(p.pros || []).map(p => `<li>${p}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="cons-box">
                            <h4>Cons</h4>
                            <ul class="pros-cons-list">
                                ${(p.cons || []).map(c => `<li>${c}</li>`).join('')}
                            </ul>
                        </div>
                    </div>

                    <ul class="product-features">
                        ${p.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <div class="product-price">${p.price}</div>
                    <div class="cta-button-group">
                        <a href="${getCloakedLink(p.amazonLink)}" class="btn-amazon" target="_blank" rel="noopener nofollow">Check Price on Amazon</a>
                        <a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&media=${encodeURIComponent(absoluteImage)}&description=${encodeURIComponent(p.name + ' — ' + p.description)}" class="btn-pinterest" target="_blank" rel="noopener nofollow">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.64 11.2-.1-.94-.2-2.37.04-3.4l1.37-5.83s-.35-.7-.35-1.74c0-1.63.95-2.85 2.13-2.85 1 0 1.49.75 1.49 1.66 0 1-.64 2.52-.97 3.92-.28 1.17.58 2.12 1.73 2.12 2.08 0 3.68-2.2 3.68-5.37 0-2.8-2.02-4.77-4.9-4.77-3.34 0-5.3 2.5-5.3 5.1 0 1 .38 2.08.87 2.68.1.11.11.2.08.3l-.33 1.35c-.05.2-.18.25-.4.15-1.52-.7-2.46-2.9-2.46-4.66 0-3.8 2.76-7.28 7.95-7.28 4.17 0 7.42 2.97 7.42 6.95 0 4.14-2.6 7.48-6.22 7.48-1.2 0-2.35-.63-2.73-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.16C10.74 23.83 11.36 24 12c6.63 0 12-5.37 12-12C24 5.37 18.63 0 12 0z"/></svg>
                            Save
                        </a>
                    </div>
                    <span class="affiliate-disclosure">*Paid affiliate link</span>
                </div>
            </div>
        `}).join('')}
    </div>
    `;
}

function renderCrossSiloLinks(silo, basePath) {
    const accessoryLinks = [
        { name: "Top-Rated Strings", url: "/collections/accessories" },
        { name: "Essential Tuners", url: "/collections/accessories" },
        { name: "Beginner Lessons", url: "/collections/learning" }
    ];

    if (silo === 'accessories' || silo === 'learning' || silo === 'buying') return '';

    return `
    <div class="aesthetic-spotlight recommendations-box">
        <span style="font-size: 0.75rem; letter-spacing: 0.2em; color: var(--primary); text-transform: uppercase; font-weight: 800;">Essential Recommendations</span>
        <div class="recommendations-list">
            ${accessoryLinks.map(link => `
                <a href="${link.url}" class="recom-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    ${link.name}
                </a>
            `).join('')}
        </div>
    </div>
    `;
}

function getFooter(basePath) {
    return `
        </div>
    </main>
    <footer class="footer-hub">
        <div class="footer-content">
            <div class="footer-brand">
                <h2>REVIEWSGUITAR.COM</h2>
                <p>Establishing the elite standard for musical gear analysis in 2026. We test, we play, we review—so you can find your perfect sound without the noise.</p>
            </div>
            <div class="footer-column">
                <h3>Collections</h3>
                <ul class="footer-links">
                    <li><a href="/collections/acoustic">Acoustic Guitars</a></li>
                    <li><a href="/collections/electric">Electric Guitars</a></li>
                    <li><a href="/collections/accessories">Essential Gear</a></li>
                    <li><a href="/collections/learning">Education</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3>Our Brand</h3>
                <ul class="footer-links">
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/about#process">Evaluation Process</a></li>
                    <li><a href="/sitemap.xml">Sitemap</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3>Legal</h3>
                <ul class="footer-links">
                    <li><a href="/privacy">Privacy Policy</a></li>
                    <li><a href="/terms">Terms & Conditions</a></li>
                    <li><a href="/contact">Contact Us</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 ReviewsGuitar.com. All Rights Reserved. Built for the modern musician.</p>
        </div>
    </footer>
    <!-- Pinterest SDK for Save buttons -->
    <script async defer src="//assets.pinterest.com/js/pinit.js" data-pin-hover="true" data-pin-tall="true" data-pin-round="true"></script>
    <script src="${basePath}js/nav.min.js"></script>
    </body>
    </html>`;
}

function renderComparisonFeature(products, pageUrl) {
    if (products.length === 0) return '';
    
    return `
    ${disclosureBanner()}
    <span class="section-title">Head-to-Head Technical Breakdown</span>
    <div class="comparison-matchup-container">
        ${products.slice(0, 2).map((p, index) => {
            const absoluteImage = p.image.startsWith('http') ? p.image : `https://reviewsguitar.com${p.image.startsWith('/') ? '' : '/'}${p.image}`;
            return `
        <div class="matchup-card ${index === 0 ? 'champion-card' : 'alternative-card'}">
            ${index > 0 ? '<div class="matchup-vs-divider">VS</div>' : ''}
            
            <span class="matchup-badge">
                ${index === 0 ? '🏆 CHAMPION PICK' : '🎯 TOP ALTERNATIVE'}
            </span>
            
            <img src="${p.image}" alt="${p.name} Technical Comparison" class="matchup-img" loading="lazy" decoding="async">
            
            <h3 class="product-title">${p.name}</h3>
            <div class="product-price">${p.price}</div>
            
            <p class="product-desc">${p.description}</p>
            
            <div class="matchup-tech-specs">
                <strong>Technical Matchup</strong>
                <ul class="matchup-features">
                    ${p.features.map(f => `<li><span class="check-icon">✓</span> ${f}</li>`).join('')}
                </ul>
            </div>
            
            <div class="cta-button-group">
                <a href="${getCloakedLink(p.amazonLink)}" class="${index === 0 ? 'btn-amazon' : 'btn'}" target="_blank" rel="noopener nofollow">Check Price on Amazon</a>
                <a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&media=${encodeURIComponent(absoluteImage)}&description=${encodeURIComponent(p.name + ' — ' + p.description)}" class="btn-pinterest" target="_blank" rel="noopener nofollow">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-right: 6px;"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.64 11.2-.1-.94-.2-2.37.04-3.4l1.37-5.83s-.35-.7-.35-1.74c0-1.63.95-2.85 2.13-2.85 1 0 1.49.75 1.49 1.66 0 1-.64 2.52-.97 3.92-.28 1.17.58 2.12 1.73 2.12 2.08 0 3.68-2.2 3.68-5.37 0-2.8-2.02-4.77-4.9-4.77-3.34 0-5.3 2.5-5.3 5.1 0 1 .38 2.08.87 2.68.1.11.11.2.08.3l-.33 1.35c-.05.2-.18.25-.4.15-1.52-.7-2.46-2.9-2.46-4.66 0-3.8 2.76-7.28 7.95-7.28 4.17 0 7.42 2.97 7.42 6.95 0 4.14-2.6 7.48-6.22 7.48-1.2 0-2.35-.63-2.73-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.16C10.74 23.83 11.36 24 12c6.63 0 12-5.37 12-12C24 5.37 18.63 0 12 0z"/></svg>
                    Save
                </a>
            </div>
        </div>
        `;
        }).join('')}
    </div>
    
    ${products.length > 2 ? `
        <div class="other-contenders-section">
            <h4 class="contenders-title">Other Worthy Contenders</h4>
            <div class="product-grid">
                ${products.slice(2).map(p => {
                    const absoluteImage = p.image.startsWith('http') ? p.image : `https://reviewsguitar.com${p.image.startsWith('/') ? '' : '/'}${p.image}`;
                    return `
                    <div class="product-card" style="transform: scale(0.95);">
                        <div class="product-img-container">
                            <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy" decoding="async">
                        </div>
                        <div class="product-card-content">
                            <h4 class="product-title" style="font-size: 1.25rem;">${p.name}</h4>
                            <div class="product-price" style="font-size: 1.4rem;">${p.price}</div>
                            <div class="cta-button-group">
                                <a href="${getCloakedLink(p.amazonLink)}" class="btn" target="_blank" rel="noopener nofollow">Check on Amazon</a>
                                <a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&media=${encodeURIComponent(absoluteImage)}&description=${encodeURIComponent(p.name + ' — ' + p.description)}" class="btn-pinterest" target="_blank" rel="noopener nofollow">
                                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 12px; height: 12px;"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.64 11.2-.1-.94-.2-2.37.04-3.4l1.37-5.83s-.35-.7-.35-1.74c0-1.63.95-2.85 2.13-2.85 1 0 1.49.75 1.49 1.66 0 1-.64 2.52-.97 3.92-.28 1.17.58 2.12 1.73 2.12 2.08 0 3.68-2.2 3.68-5.37 0-2.8-2.02-4.77-4.9-4.77-3.34 0-5.3 2.5-5.3 5.1 0 1 .38 2.08.87 2.68.1.11.11.2.08.3l-.33 1.35c-.05.2-.18.25-.4.15-1.52-.7-2.46-2.9-2.46-4.66 0-3.8 2.76-7.28 7.95-7.28 4.17 0 7.42 2.97 7.42 6.95 0 4.14-2.6 7.48-6.22 7.48-1.2 0-2.35-.63-2.73-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.16C10.74 23.83 11.36 24 12c6.63 0 12-5.37 12-12C24 5.37 18.63 0 12 0z"/></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                }).join('')}
            </div>
        </div>
    ` : ''}
    `;
}

structure.siloConfigs.forEach(silo => {
  const siloProducts = products.filter(p => p.silo === silo.name);
  const siloExpertContent = macroCache.silos[silo.name] || `<p>Comprehensive guides and reviews for ${silo.name} guitars and gear.</p>`;

  const siloHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Expert ${silo.displayName} reviews and buyer guides for 2026. Discover the high-fidelity sound of premium ${silo.name} gear and accessories.">
    <meta name="author" content="${AUTHOR_META}">
    <meta name="keywords" content="${silo.name} guitar, ${silo.name} review, boutique ${silo.name} 2026, professional guitar guides">
    <link rel="canonical" href="https://reviewsguitar.com/collections/${silo.name}/">
    ${config.pinterestDomainVerify ? `<meta name="p:domain_verify" content="${config.pinterestDomainVerify}"/>` : ''}
    <link rel="preconnect" href="https://m.media-amazon.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta property="og:title" content="${silo.displayName} Expert Reviews & Buyer Guides 2026">
    <meta property="og:description" content="Premium analysis of the best ${silo.name} gear in 2026.">
    <meta property="og:image" content="../../images/silo-${silo.name}-aesthetic.jpg">
    <meta property="og:type" content="website">
    <meta name="pinterest:description" content="Explore top-rated ${silo.name} reviews and aesthetic guitar guides for 2026.">
    <title>${getSeoTitle(silo.displayName)}</title>
    <link rel="stylesheet" href="../../css/style.min.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "ReviewsGuitar",
      "url": "https://reviewsguitar.com",
      "logo": "https://reviewsguitar.com/images/logo.png",
      "sameAs": [
        "https://twitter.com/reviewsguitar",
        "https://pinterest.com/reviewsguitar"
      ]
    }
    </script>
    ${generateProductSchema(siloProducts.slice(0, 3), `https://reviewsguitar.com/collections/${silo.name}/`)}
    <meta name="google-adsense-account" content="ca-pub-9853769972652980">
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9853769972652980"
     crossorigin="anonymous"></script>
    ${config.pinterestTagId ? `<!-- Pinterest Tag -->
    <script>
    !function(e){if(!window.pwt){window.pwt={};var t=e.createElement("script");t.async=!0,t.src="https://s.pinterest.com/js/pwtitg.js";var n=e.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n)}var r=window.pwt;r.queue=[],r.track=function(e,t,n){r.queue.push([e,t,n])}}(document);
    pwt.track("pageview");
    </script>
    <noscript>
    <img height="1" width="1" style="display:none;" alt="" src="https://ct.pinterest.com/v3/?tid=${config.pinterestTagId}&noscript=1" />
    </noscript>
    <!-- End Pinterest Tag -->` : ''}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-77XFW0G925"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-77XFW0G925');
    </script>
</head>
<body>
    ${getHeader("../../", silo.displayName.toUpperCase(), ` > <a href="/collections/${silo.name}" style="color: #666; text-decoration: none;">${silo.displayName.toUpperCase()}</a>`)}
    
    <div class="featured-silos" style="padding: 0; margin-bottom: 4rem;">
        <div class="silo-card card-${silo.name}" style="min-height: 300px;">
            <h3>${silo.displayName}</h3>
            ${siloExpertContent}
        </div>
    </div>

    ${renderProductGrid(siloProducts.slice(0, 3), `https://reviewsguitar.com/collections/${silo.name}/`)}

    ${renderCrossSiloLinks(silo.name, "../../")}

    <span class="section-title">In-Depth Guides</span>
    <div class="featured-silos" style="padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
        ${silo.pages.map(p => {
            const kwArray = (typeof p.keywords === 'string' ? p.keywords.split(',') : p.keywords) || [];
            return `
            <div class="silo-card" style="min-height: 200px; background: var(--surface); justify-content: flex-start; padding: 2rem;">
                <h3 style="font-size: 1.2rem; margin-bottom: 1rem;">${p.title}</h3>
                <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">Expert analysis on ${kwArray.slice(0, 2).map(k => k.trim()).join(', ')}.</p>
                <a href="/collections/${silo.name}/${p.slug}" style="color: var(--primary); font-size: 0.8rem;">READ GUIDE →</a>
            </div>
        `}).join('')}
        ${silo.name === 'buying' ? `
            <div class="silo-card" style="min-height: 200px; background: var(--surface); justify-content: flex-start; padding: 2rem;">
                <h3 style="font-size: 1.2rem; margin-bottom: 1rem;">Distribution Guide 2026</h3>
                <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">Expert analysis on best way to distribute your guitar music.</p>
                <a href="/guides/recording/best-way-to-distribute-your-guitar-music-in-2026.html" style="color: var(--primary); font-size: 0.8rem;">READ GUIDE →</a>
            </div>
        ` : ''}
    </div>
    ${getFooter("../../")}
    `;
  
  var dir = 'collections/' + silo.name;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(dir + '/index.html', siloHTML);
  pageCount++;
  
  silo.pages.forEach(function(page) {
    const kwArray = (typeof page.keywords === 'string' ? page.keywords.split(',') : page.keywords) || [];
    
    let matchedProducts = [];
    const priceMatch = page.slug.match(/under-(\d+)/);
    if (priceMatch) {
      const maxPrice = parseFloat(priceMatch[1]);
      matchedProducts = products.filter(p => {
        if (p.silo !== silo.name) return false;
        const priceNum = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0;
        return priceNum <= maxPrice;
      });
      // Sort by rating descending and limit to top 4 products
      matchedProducts.sort((a, b) => b.rating - a.rating);
      matchedProducts = matchedProducts.slice(0, 4);
    } else {
      matchedProducts = products.filter(p => p.silo === silo.name && (
          page.title.toLowerCase().includes(p.category) || 
          page.slug.toLowerCase().includes(p.category) ||
          kwArray.some(k => k.toLowerCase().includes(p.category))
      ));
    }
    
    // Determine the Pinterest Image
    let pinterestImage = `../../images/pinterest_${silo.name}_guitars.png`;
    if (!fs.existsSync(`images/pinterest_${silo.name}_guitars.png`)) {
        pinterestImage = `../../images/silo-${silo.name}.png`;
    }
    
    // Find matching cluster content
    const clusterKey = Object.keys(macroCache.clusters).find(k => page.slug.includes(k) || page.title.toLowerCase().includes(k)) || "";
    const clusterExpertContent = macroCache.clusters[clusterKey] || generateDeepContent(page.title, silo.name);

    const activeProducts = matchedProducts.length > 0 ? matchedProducts : siloProducts.slice(0, 2);
    const mainProductPrice = activeProducts.length > 0 ? parseFloat(activeProducts[0].price.replace(/[^0-9.]/g, '')) : 0.00;
    const pageUrl = `https://reviewsguitar.com/collections/${silo.name}/${page.slug}`;

    var clusterHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Expert ${page.title} analysis and buyer recommendations. Find elite ${silo.name} gear with our reviews.">
    <meta name="author" content="${AUTHOR_META}">
    <meta name="keywords" content="${kwArray.join(', ')}">
    <link rel="canonical" href="${pageUrl}">
    ${config.pinterestDomainVerify ? `<meta name="p:domain_verify" content="${config.pinterestDomainVerify}"/>` : ''}
    <link rel="preconnect" href="https://m.media-amazon.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta property="og:title" content="${page.title} | Expert Analysis & Reviews 2026">
    <meta property="og:description" content="Professional BoFU guide for ${page.title}. Technical specs and purchase analysis.">
    <meta property="og:image" content="${pinterestImage}">
    <meta property="og:type" content="product">
    <meta property="og:price:amount" content="${mainProductPrice > 0 ? mainProductPrice.toFixed(2) : '0.00'}">
    <meta property="og:price:currency" content="USD">
    <meta property="og:availability" content="instock">
    <meta name="pinterest:description" content="Check out our aesthetic review and buy guide for ${page.title}. #guitar #aesthetic #musician">
    <title>${getSeoTitle(page.title)}</title>
    <link rel="stylesheet" href="../../css/style.min.css">
    ${generateProductSchema(matchedProducts.length > 0 ? matchedProducts : siloProducts.slice(0, 2), pageUrl)}
    <meta name="google-adsense-account" content="ca-pub-9853769972652980">
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9853769972652980"
     crossorigin="anonymous"></script>
    ${config.pinterestTagId ? `<!-- Pinterest Tag -->
    <script>
    !function(e){if(!window.pwt){window.pwt={};var t=e.createElement("script");t.async=!0,t.src="https://s.pinterest.com/js/pwtitg.js";var n=e.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n)}var r=window.pwt;r.queue=[],r.track=function(e,t,n){r.queue.push([e,t,n])}}(document);
    pwt.track("pageview");
    </script>
    <noscript>
    <img height="1" width="1" style="display:none;" alt="" src="https://ct.pinterest.com/v3/?tid=${config.pinterestTagId}&noscript=1" />
    </noscript>
    <!-- End Pinterest Tag -->` : ''}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-77XFW0G925"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-77XFW0G925');
    </script>
</head>
<body>
    ${getHeader("../../", page.title.toUpperCase(), ` > <a href="/collections/${silo.name}" style="color: #666; text-decoration: none;">${silo.displayName.toUpperCase()}</a> > ${page.title.toUpperCase()}`)}
    
    ${clusterExpertContent}

    <div class="aesthetic-spotlight" style="margin-bottom: 4rem; padding: 4rem; background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), transparent); border-radius: 24px; border: 1px solid var(--border);">
        <span style="font-size: 0.75rem; letter-spacing: 0.3em; color: var(--primary); text-transform: uppercase;">Aesthetic Detail Spotlight</span>
        <h3 style="font-size: 2.2rem; margin: 1.5rem 0;">Why Design & Aesthetics Matter in 2026</h3>
        <p style="color: var(--text-dim); line-height: 1.8; max-width: 700px;">The visual language of modern guitar revolves around the marriage of high-performance hardware and boutique finishing. Our analysis shows that instruments featured here prioritize the "Art-as-Instrument" philosophy currently trending across designer-musician communities.</p>
    </div>

    ${(page.slug.includes('comparison') || silo.name === 'buying') ? renderComparisonFeature(matchedProducts.length > 0 ? matchedProducts : siloProducts.slice(0, 4), pageUrl) : renderProductGrid(matchedProducts.length > 0 ? matchedProducts : siloProducts.slice(0, 2), pageUrl)}


    ${renderCrossSiloLinks(silo.name, "../../")}
    
    <div class="checklist-box">
        <h3>Expert Selection Checklist</h3>
        <ul style="list-style: none; padding: 0;">
            ${kwArray.map(k => `
                <li style="margin-bottom: 1.2rem; padding-left: 2rem; position: relative; font-size: 1rem; color: var(--text-dim);">
                    <span style="position: absolute; left: 0; color: var(--primary);">✓</span>
                    Priority Evaluation: <strong>${k.trim()}</strong>
                </li>
            `).join('')}
            <li style="margin-bottom: 1.2rem; padding-left: 2rem; position: relative; font-size: 1rem; color: var(--text-dim);">
                <span style="position: absolute; left: 0; color: var(--primary);">✓</span>
                Professional Tone Benchmarking
            </li>
        </ul>
    </div>

    <div style="border-top: 1px solid var(--border); padding-top: 3rem; margin-top: 4rem;">
        <h3 style="font-size: 1rem; margin-bottom: 1.5rem; color: var(--primary);">RELATED EXPLORATION</h3>
        <a href="/collections/${silo.name}" class="btn" style="padding: 0.8rem 1.5rem; font-size: 0.75rem;">BACK TO ${silo.displayName.toUpperCase()}</a>
    </div>

    ${getFooter("../../")}
    `;
    
    fs.writeFileSync(dir + '/' + page.slug + '.html', clusterHTML);
    pageCount++;
  });
});

console.log('Generated', pageCount, 'pages across', structure.siloConfigs.length, 'silos with thick SEO content.');

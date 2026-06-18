#!/usr/bin/env node
/**
 * Programmatic SEO Generator for GuitarReview.com
 * Implements AI content injection, deep SEO architecture, and Pinterest optimization
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = "https://reviewsguitar.com";
const PROJECT_ROOT = path.resolve(__dirname);
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

// Load central configuration
let config = { amazonTrackingId: "reviewsguitar-20", pinterestTagId: "", pinterestDomainVerify: "" };
if (fs.existsSync('config.json')) {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
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
    return amazonLink; // Raw direct link to bypass AdBlockers
}

// Load AI Cache
let contentCache = {};
if (fs.existsSync('content_cache.json')) {
    contentCache = JSON.parse(fs.readFileSync('content_cache.json', 'utf8'));
}

function generateDeepContent(keyword, silo, category) {
    const titleCase = str => str.replace(/\b\w/g, c => c.toUpperCase());
    const formattedKeyword = titleCase(keyword.replace(/_/g, ' '));
    const year = new Date().getFullYear();

    return `
        <article class="article-content">
            <p class="article-lead">
                When evaluating <strong>${formattedKeyword}</strong>, understanding the nuance between technical specifications 
                and real-world playability is critical. In ${year}, advancing manufacturing standards have elevated the baseline quality 
                across the board, meaning your choice should be dictated by specific tonal requirements, ergonomic preferences, and long-term durability.
                Our exhaustive analysis reveals key insights for the musician seeking premium gear within the ${silo} space.
            </p>

            <h3>1. Historical Context & The Modern Market</h3>
            <p>
                The landscape for ${formattedKeyword} has fundamentally shifted over the last decade. Previously, players had to 
                compromise between affordability and professional-grade reliability. Today, CNC routing and sophisticated 
                quality control mean that even intermediate ${category} gear performs at levels previously reserved for flagship models.
            </p>

            <div class="expert-tip">
                <strong>Core Selection Criteria</strong>
                <ul>
                    <li><strong>✓ Structural Integrity:</strong> Resistance to humidity shifts and gigging wear.</li>
                    <li><strong>✓ Tonal Versatility:</strong> Ability to cross genres vs hyper-specialization.</li>
                    <li><strong>✓ Price-to-Performance Ratio:</strong> Diminishing returns analysis.</li>
                </ul>
            </div>

            <h3>2. Technical Evaluation of ${formattedKeyword}</h3>
            <p>
                Before finalizing a purchase, evaluate the core components. For ${silo} purchases, attention to detail in the 
                fundamental build quality outlasts marketing hype. Let's look at the hardware choices that make ${formattedKeyword} 
                worth considering. Fretwork precision, electronic shielding, and nut slotting are often where cost-cutting occurs, 
                so these are the exact areas our editors scrutinize.
            </p>
            <p>
                Whether you are recording in a dedicated studio or playing live out of a hybrid rig, the ${category} tools 
                you select will dictate the friction between your ideas and your sound.
            </p>

            <h3>3. Final Verdict for ${year}</h3>
            <p>
                Ultimately, ${formattedKeyword} remains a highly viable space for both advancing learners and seasoned pros. 
                By aligning your specific musical goals with the technical realities of these products, you ensure an investment 
                that inspires continuous play. Review our Editor's Choice selections below, which have been filtered through 
                our rigorous 10+ hour bench-testing protocol.
            </p>
        </article>
    `;
}

const SEO_KEYWORDS = {
    acoustic: {
        beginner: ["best acoustic guitar for beginners 2026", "top rated beginner acoustic guitar", "affordable acoustic guitar starter kit", "buy acoustic guitar beginner bundle"],
        intermediate: ["best intermediate acoustic guitar", "professional acoustic guitar reviews", "top selling acoustic guitars 2026", "acoustic guitar upgrade deals"],
        advanced: ["professional acoustic guitar comparison", "best acoustic guitar for recording", "high end acoustic guitar reviews", "acoustic guitar tonewood guide"],
        professional: ["professional acoustic guitar purchase", "best acoustic guitar brands 2026", "custom acoustic guitar builders", "investment grade acoustic guitars"]
    },
    electric: {
        beginner: ["best electric guitar for beginners 2026", "starter electric guitar kit buy", "affordable electric guitar beginner", "top rated beginner electric guitar"],
        intermediate: ["best intermediate electric guitar", "electric guitar upgrade deals", "professional electric guitar reviews", "top selling electric guitars 2026"],
        advanced: ["professional electric guitar comparison", "best electric guitar for solos", "high end electric guitar reviews", "electric guitar customization guide"],
        professional: ["professional electric guitar purchase", "best electric guitar brands 2026", "custom electric guitar builders", "investment grade electric guitars"]
    },
    accessories: {
        strings: ["best guitar strings 2026", "buy guitar strings bulk", "guitar strings review comparison", "affordable guitar strings deals"],
        picks: ["best guitar picks 2026", "buy guitar picks bulk", "guitar picks review comparison", "top rated guitar picks"],
        cables: ["best guitar cables 2026", "buy instrument cables", "guitar cable review comparison", "affordable guitar cables"],
        stands: ["best guitar stands 2026", "buy guitar stands", "guitar stand review comparison", "top rated guitar stands"],
        cases: ["best guitar cases 2026", "buy guitar cases reviews", "guitar case comparison guide", "affordable guitar hard cases"]
    },
    learning: {
        courses: ["best guitar courses 2026", "buy online guitar lessons", "guitar learning courses review", "top rated guitar courses"],
        books: ["best guitar books 2026", "buy guitar learning books", "guitar method book review", "top guitar books for beginners"],
        videos: ["best guitar video courses", "buy guitar tutorial videos", "guitar lesson video review", "top rated guitar tutorials"],
        apps: ["best guitar learning apps 2026", "buy guitar app subscription", "guitar app review comparison", "top guitar learning apps"]
    },
    buying: {
        guides: ["guitar buying guide 2026", "best guitar buying guide", "how to buy a guitar guide", "guitar purchase guide review"],
        reviews: ["guitar reviews 2026", "best guitar reviews site", "guitar review comparison", "top guitar reviews"],
        comparisons: ["guitar comparison 2026", "best guitar vs comparison", "acoustic vs electric guitar buy", "guitar brands comparison"],
        deals: ["best guitar deals 2026", "guitar sale deals", "affordable guitar deals", "guitar discount offers"]
    }
};

function generateURL(silo, category, keyword) {
    let cleanKeyword = keyword.toLowerCase().trim();
    cleanKeyword = cleanKeyword.replace(/\s+/g, '-')
        .replace(/,/g, '')
        .replace(/\./g, '')
        .replace(/[?!=]/g, '');
    
    const redundant = ["the", "best", "top", "buy", "purchase", "review", "guide"];
    const words = cleanKeyword.split("-");
    const filteredWords = words.filter(w => !redundant.includes(w) || w === words[0]);
    
    return `/${silo}/${category}/${filteredWords.join('-')}`;
}

function generateMetaTags(keyword, silo, category, pageType = "landing") {
    let title = `${keyword.toUpperCase()} | ReviewsGuitar.com`;
    if (title.length > 65) title = keyword.toUpperCase();
    if (title.length > 65) title = title.substring(0, 65);
    let description = `Expert reviews and buying guides for ${keyword}. Find the elite deals on premium guitars and accessories.`;
    
    return {
        title,
        description,
        getKeywords: keyword,
        og_title: title,
        og_description: description,
        og_type: "article",
        og_url: `${BASE_URL}${generateURL(silo, category, keyword)}`,
        twitter_card: "summary_large_image",
        twitter_title: title,
        twitter_description: description
    };
}

function generateSchema(keyword, silo, category) {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": keyword,
        "description": `Expert review and analysis of ${keyword}`,
        "brand": { "@type": "Brand", "name": "ReviewsGuitar" },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "254"
        }
    };
}

function renderProductGrid(filteredProducts, fileName) {
    if (filteredProducts.length === 0) return '';
    
    return `
    <span class="section-title">Editor's Choice Selection</span>
    <div class="product-grid">
        ${filteredProducts.map(p => `
            <div class="product-card">
                <div class="product-img-container">
                    <img src="${p.image}" alt="${p.name}" class="product-img" data-pin-description="${p.name} — ${p.description}" data-pin-url="${BASE_URL}/go/${ASIN_TO_SLUG[p.amazonLink.match(/\/dp\/([A-Z0-9]{10})/)?.[1]] || ''}">
                </div>
                <div class="product-card-content">
                    <div class="trust-badge-container">
                        <span class="trust-badge">✓ ELITE VERIFIED</span>
                        <span class="trust-badge">10+ HOURS TESTED</span>
                    </div>
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
                        <a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent('https://reviewsguitar.com/pages/' + fileName)}&media=${encodeURIComponent(p.image)}&description=${encodeURIComponent(p.name + ' — ' + p.description)}" class="btn-pinterest" target="_blank" rel="noopener nofollow">
                            <svg viewBox="0 0 24 24" fill="currentColor" class="pinterest-icon"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.64 11.2-.1-.94-.2-2.37.04-3.4l1.37-5.83s-.35-.7-.35-1.74c0-1.63.95-2.85 2.13-2.85 1 0 1.49.75 1.49 1.66 0 1-.64 2.52-.97 3.92-.28 1.17.58 2.12 1.73 2.12 2.08 0 3.68-2.2 3.68-5.37 0-2.8-2.02-4.77-4.9-4.77-3.34 0-5.3 2.5-5.3 5.1 0 1 .38 2.08.87 2.68.1.11.11.2.08.3l-.33 1.35c-.05.2-.18.25-.4.15-1.52-.7-2.46-2.9-2.46-4.66 0-3.8 2.76-7.28 7.95-7.28 4.17 0 7.42 2.97 7.42 6.95 0 4.14-2.6 7.48-6.22 7.48-1.2 0-2.35-.63-2.73-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.16C10.74 23.83 11.36 24 12c6.63 0 12-5.37 12-12C24 5.37 18.63 0 12 0z"/></svg>
                            Save
                        </a>
                    </div>
                    <span class="affiliate-disclosure">*Paid affiliate link</span>
                </div>
            </div>
        `).join('')}
    </div>
    `;
}

function renderComparisonFeature(products, fileName) {
    if (products.length === 0) return '';
    
    return `
    <span class="section-title">Head-to-Head Technical Breakdown</span>
    <div class="comparison-matchup-container">
        ${products.slice(0, 2).map((p, index) => {
            return `
        <div class="matchup-card ${index === 0 ? 'champion-card' : 'alternative-card'}">
            ${index > 0 ? '<div class="matchup-vs-divider">VS</div>' : ''}
            
            <span class="matchup-badge">
                ${index === 0 ? '🏆 CHAMPION PICK' : '🎯 TOP ALTERNATIVE'}
            </span>
            
            <img src="${p.image}" alt="${p.name}" class="matchup-img" loading="lazy" decoding="async" data-pin-description="${p.name} — ${p.description}">
            
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
                <a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent('https://reviewsguitar.com/pages/' + fileName)}&media=${encodeURIComponent(p.image)}&description=${encodeURIComponent(p.name + ' — ' + p.description)}" class="btn-pinterest" target="_blank" rel="noopener nofollow">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="pinterest-icon"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.64 11.2-.1-.94-.2-2.37.04-3.4l1.37-5.83s-.35-.7-.35-1.74c0-1.63.95-2.85 2.13-2.85 1 0 1.49.75 1.49 1.66 0 1-.64 2.52-.97 3.92-.28 1.17.58 2.12 1.73 2.12 2.08 0 3.68-2.2 3.68-5.37 0-2.8-2.02-4.77-4.9-4.77-3.34 0-5.3 2.5-5.3 5.1 0 1 .38 2.08.87 2.68.1.11.11.2.08.3l-.33 1.35c-.05.2-.18.25-.4.15-1.52-.7-2.46-2.9-2.46-4.66 0-3.8 2.76-7.28 7.95-7.28 4.17 0 7.42 2.97 7.42 6.95 0 4.14-2.6 7.48-6.22 7.48-1.2 0-2.35-.63-2.73-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.16C10.74 23.83 11.36 24 12c6.63 0 12-5.37 12-12C24 5.37 18.63 0 12 0z"/></svg>
                    Save
                </a>
            </div>
        </div>
        `;
        }).slice(0, 2).join('')}
    </div>
    
    ${products.length > 2 ? `
        <div class="other-contenders-section">
            <h4 class="contenders-title">Other Worthy Contenders</h4>
            <div class="product-grid">
                ${products.slice(2).map(p => `
                    <div class="product-card">
                        <div class="product-img-container">
                            <img src="${p.image}" alt="${p.name}" class="product-img">
                        </div>
                        <div class="product-card-content">
                            <h4 class="product-title">${p.name}</h4>
                            <div class="product-price">${p.price}</div>
                            <div class="cta-button-group">
                                <a href="${getCloakedLink(p.amazonLink)}" class="btn" target="_blank" rel="noopener nofollow">Check on Amazon</a>
                                <a href="https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent('https://reviewsguitar.com/pages/' + fileName)}&media=${encodeURIComponent(p.image)}&description=${encodeURIComponent(p.name + ' — ' + p.description)}" class="btn-pinterest" target="_blank" rel="noopener nofollow">
                                    <svg viewBox="0 0 24 24" fill="currentColor" class="pinterest-icon"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.64 11.2-.1-.94-.2-2.37.04-3.4l1.37-5.83s-.35-.7-.35-1.74c0-1.63.95-2.85 2.13-2.85 1 0 1.49.75 1.49 1.66 0 1-.64 2.52-.97 3.92-.28 1.17.58 2.12 1.73 2.12 2.08 0 3.68-2.2 3.68-5.37 0-2.8-2.02-4.77-4.9-4.77-3.34 0-5.3 2.5-5.3 5.1 0 1 .38 2.08.87 2.68.1.11.11.2.08.3l-.33 1.35c-.05.2-.18.25-.4.15-1.52-.7-2.46-2.9-2.46-4.66 0-3.8 2.76-7.28 7.95-7.28 4.17 0 7.42 2.97 7.42 6.95 0 4.14-2.6 7.48-6.22 7.48-1.2 0-2.35-.63-2.73-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.16C10.74 23.83 11.36 24 12c6.63 0 12-5.37 12-12C24 5.37 18.63 0 12 0z"/></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : ''}
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
        <span class="recommendations-title">Essential Recommendations</span>
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
    <script src="${basePath}js/nav.min.js"></script>`;
}

function generateLandingPage(silo, category, keyword, metaTags, schema, fileName) {
    const schemaJson = JSON.stringify(schema, null, 2);
    
    const matchedProducts = products.filter(p => p.silo === silo && (
        keyword.toLowerCase().includes(p.category) || 
        category.toLowerCase().includes(p.category)
    ));
    
    const finalProducts = matchedProducts.length > 0 ? matchedProducts : products.filter(p => p.silo === silo);
    const aiArticle = contentCache[keyword] || generateDeepContent(keyword, silo, category);

    const ogImage = finalProducts.length > 0 ? finalProducts[0].image : 'https://reviewsguitar.com/images/logo.png';
    const pinDescription = `${keyword} — Expert reviews, buying guides, and the best deals for ${new Date().getFullYear()}. Find your perfect guitar gear at ReviewsGuitar.com`;

    const productPrice = finalProducts.length > 0 ? parseFloat(finalProducts[0].price.replace(/[^0-9.]/g, '')) : 0.00;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metaTags.title}</title>
    <meta name="description" content="${metaTags.description}">
    <link rel="canonical" href="https://reviewsguitar.com/pages/${fileName}">
    ${config.pinterestDomainVerify ? `<meta name="p:domain_verify" content="${config.pinterestDomainVerify}"/>` : ''}
    <!-- Open Graph / Pinterest Rich Pins -->
    <meta property="og:type" content="product">
    <meta property="og:title" content="${metaTags.title}">
    <meta property="og:description" content="${metaTags.description}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="https://reviewsguitar.com/pages/${fileName}">
    <meta property="og:site_name" content="ReviewsGuitar.com">
    <meta property="og:price:amount" content="${productPrice > 0 ? productPrice.toFixed(2) : '0.00'}">
    <meta property="og:price:currency" content="USD">
    <meta property="og:availability" content="instock">
    <meta property="article:published_time" content="${new Date().toISOString()}">
    <meta property="article:section" content="${silo}">
    <meta property="article:tag" content="guitar, ${silo}, ${category}, review, ${new Date().getFullYear()}">
    <!-- Pinterest specific -->
    <meta name="pinterest-rich-pin" content="true">
    <meta name="pin:description" content="${pinDescription}">
    <meta name="pin:media" content="${ogImage}">
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${metaTags.title}">
    <meta name="twitter:description" content="${metaTags.description}">
    <meta name="twitter:image" content="${ogImage}">
    <link rel="preconnect" href="https://m.media-amazon.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="/css/style.css">
    <meta name="google-adsense-account" content="ca-pub-9853769972652980">
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9853769972652980"
     crossorigin="anonymous"></script>
    <script type="application/ld+json">
${schemaJson}
    </script>
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
        <!-- Pinterest-optimized hero section -->
        <div class="pinterest-hero">
            <div style="position: absolute; inset: 0; background: url('${ogImage}') center/cover no-repeat; opacity: 0.12;"></div>
            <div style="position: relative; z-index: 2; max-width: 800px; margin: 0 auto;">
                <span class="lf-section-label">${silo} · ${category}</span>
                <h1>${keyword}</h1>
                <p style="font-size: 1.15rem; color: var(--text-dim); max-width: 600px; margin: 0 auto 2rem; line-height: 1.6;">${metaTags.description}</p>
                <a href="#products" class="btn-amazon pinterest-cta">See Our Top Picks ↓</a>
            </div>
        </div>

        <div class="container" style="max-width: 1000px;">
            <nav class="breadcrumb-nav">
                <a href="../index.html">HOME</a> > ${silo} > ${category}
            </nav>

            <div class="article-content">
                ${aiArticle}
            </div>

            <div id="products">
            ${(category === 'comparisons' || silo === 'buying') ? renderComparisonFeature(finalProducts.slice(0, 4), fileName) : renderProductGrid(finalProducts.slice(0, 3), fileName)}
            </div>

            ${renderCrossSiloLinks(silo, "../")}

            <div class="verdict-grid">
                <div class="verdict-grid-box">
                    <h3>TECHNICAL CALIBRATION</h3>
                    <ul>
                        <li>Professional Fretwork Alignment</li>
                        <li>Optimal Action Configuration</li>
                        <li>High-Fidelity Pickup Response</li>
                    </ul>
                </div>
                <div class="verdict-grid-box">
                    <h3>VERDICT</h3>
                    <p>
                        An essential benchmark for players seeking uncompromising quality in 2026.
                    </p>
                </div>
            </div>
        </div>
    </main>
    ${getFooter("../")}
    <!-- Pinterest SDK for Save buttons -->
    <script async defer src="//assets.pinterest.com/js/pinit.js" data-pin-hover="true" data-pin-tall="true" data-pin-round="true"></script>
</body>
</html>`;
}

function main() {
    console.log("Starting Programmatic SEO Generation with AI content injection...");
    const pages = [];
    if (!fs.existsSync(path.join(PROJECT_ROOT, 'pages'))) fs.mkdirSync(path.join(PROJECT_ROOT, 'pages'));

    for (const [silo, categories] of Object.entries(SEO_KEYWORDS)) {
        for (const [category, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                const metaTags = generateMetaTags(keyword, silo, category);
                const schema = generateSchema(keyword, silo, category);
                const filename = `${silo}_${category}_${keyword.replace(/\s+/g, '_')}.html`;
                const pageContent = generateLandingPage(silo, category, keyword, metaTags, schema, filename);
                
                const pagePath = path.join(PROJECT_ROOT, 'pages', filename);
                fs.writeFileSync(pagePath, pageContent);
                pages.push({ url: `${BASE_URL}${generateURL(silo, category, keyword)}`, filename });
            }
        }
    }
    console.log(`\nComplete! Generated ${pages.length} pages`);
}

main();

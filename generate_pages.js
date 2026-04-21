const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
let pageCount = 0;

// Load Macro Content Cache
// Load Macro Content Cache
let macroCache = { clusters: {}, silos: {} };
if (fs.existsSync('macro_content_cache.json')) {
    macroCache = JSON.parse(fs.readFileSync('macro_content_cache.json', 'utf8'));
}

function generateDeepContent(keyword, silo) {
    const titleCase = str => str.replace(/\b\w/g, c => c.toUpperCase());
    const formattedKeyword = titleCase(keyword.replace(/_/g, ' '));
    const year = new Date().getFullYear();

    return `
        <article style="max-width: 900px; margin-bottom: 4rem;">
            <p style="font-size: 1.2rem; color: var(--text-dim); margin-bottom: 2.5rem; line-height: 1.8;">
                This comprehensive guide covers everything you need to know about <strong>${formattedKeyword}</strong>. 
                Whether you're a beginner or an experienced player, our expert reviews and recommendations will help you make the right choice.
                In ${year}, advancing manufacturing standards have elevated the baseline quality 
                across the board, meaning your choice should be dictated by specific tonal requirements, ergonomic preferences, and long-term durability.
            </p>

            <h3 style="font-size: 1.8rem; margin-bottom: 1rem; margin-top: 3rem;">1. Historical Context & The Modern Market</h3>
            <p style="font-size: 1.05rem; line-height: 1.7; color: var(--text-dim); margin-bottom: 1.5rem;">
                The landscape for ${formattedKeyword} has fundamentally shifted over the last decade. Previously, players had to 
                compromise between affordability and professional-grade reliability. Today, CNC routing and sophisticated 
                quality control mean that even intermediate gear performs at levels previously reserved for flagship models in the ${silo} space.
            </p>

            <div style="background: var(--glass); border: 1px solid var(--border); padding: 2rem; border-radius: 8px; margin: 2rem 0;">
                <h4 style="font-size: 1.2rem; color: var(--primary); margin-bottom: 1rem;">Core Selection Criteria</h4>
                <ul style="list-style-type: none; padding: 0;">
                    <li style="margin-bottom: 0.8rem;"><strong>✓ Structural Integrity:</strong> Resistance to humidity shifts and gigging wear.</li>
                    <li style="margin-bottom: 0.8rem;"><strong>✓ Tonal Versatility:</strong> Ability to cross genres vs hyper-specialization.</li>
                    <li style="margin-bottom: 0.8rem;"><strong>✓ Price-to-Performance Ratio:</strong> Diminishing returns analysis.</li>
                </ul>
            </div>

            <h3 style="font-size: 1.8rem; margin-bottom: 1rem; margin-top: 3rem;">2. Technical Evaluation of ${formattedKeyword}</h3>
            <p style="font-size: 1.05rem; line-height: 1.7; color: var(--text-dim); margin-bottom: 1.5rem;">
                Before finalizing a purchase, evaluate the core components. Attention to detail in the 
                fundamental build quality outlasts marketing hype. Let's look at the hardware choices that make ${formattedKeyword} 
                worth considering. Fretwork precision, electronic shielding, and nut slotting are often where cost-cutting occurs, 
                so these are the exact areas our editors scrutinize.
            </p>

            <h3 style="font-size: 1.8rem; margin-bottom: 1rem; margin-top: 3rem;">3. Final Verdict for ${year}</h3>
            <p style="font-size: 1.05rem; line-height: 1.7; color: var(--text-dim); margin-bottom: 1.5rem;">
                Ultimately, ${formattedKeyword} remains a highly viable space for both advancing learners and seasoned pros. 
                By aligning your specific musical goals with the technical realities of these products, you ensure an investment 
                that inspires continuous play. Review our Editor's Choice selections below, which have been filtered through 
                our rigorous 10+ hour bench-testing protocol.
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
        <ul>
            <li><a href="${basePath}index.html">Home</a></li>
            <li><a href="${basePath}collections/acoustic/index.html">Acoustic</a></li>
            <li><a href="${basePath}collections/electric/index.html">Electric</a></li>
            <li><a href="${basePath}collections/accessories/index.html">Accessories</a></li>
            <li><a href="${basePath}collections/learning/index.html">Learning</a></li>
            <li><a href="${basePath}collections/buying/index.html">Guides</a></li>
        </ul>
    </nav>
    <main>
        <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
            <nav style="font-size: 0.8rem; color: #666; margin-bottom: 2rem;">
                <a href="${basePath}index.html" style="color: #666; text-decoration: none;">HOME</a> ${breadcrumbs}
            </nav>
            <h2 style="font-size: 3rem; margin-bottom: 3rem;">${title}</h2>
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
                "name": p.brand || "ReviewsGuitar Elite"
            },
            "offers": {
                "@type": "Offer",
                "url": url,
                "priceCurrency": "USD",
                "price": p.price.replace(/[^0-9.]/g, ''),
                "itemCondition": "https://schema.org/NewCondition",
                "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": p.rating,
                "reviewCount": Math.floor(Math.random() * 50) + 20
            }
        }))
    };
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function renderProductGrid(filteredProducts) {
    if (filteredProducts.length === 0) return '';
    
    return `
    <span class="section-title">Editor's Choice Selection</span>
    <div class="product-grid">
        ${filteredProducts.map(p => `
            <div class="product-card">
                <div class="product-img-container">
                    <img src="${p.image}" alt="${p.name} - Expert Review & Analysis" class="product-img" loading="lazy" decoding="async">
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
                    <a href="${p.amazonLink}" class="btn-amazon" target="_blank" rel="noopener nofollow">Check Price on Amazon</a>
                    <span style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.5rem; display: block;">*Paid affiliate link</span>
                </div>
            </div>
        `).join('')}
    </div>
    `;
}

function renderCrossSiloLinks(silo, basePath) {
    const accessoryLinks = [
        { name: "Top-Rated Strings", url: basePath + "collections/accessories/index.html" },
        { name: "Essential Tuners", url: basePath + "collections/accessories/index.html" },
        { name: "Beginner Lessons", url: basePath + "collections/learning/index.html" }
    ];

    if (silo === 'accessories' || silo === 'learning' || silo === 'buying') return '';

    return `
    <div style="margin: 4rem 0; padding: 3rem; background: var(--glass); border: 1px solid var(--border); border-radius: 12px;">
        <h4 style="font-size: 0.75rem; letter-spacing: 0.2em; color: var(--primary); margin-bottom: 1.5rem; text-transform: uppercase;">Essential Recommendations</h4>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            ${accessoryLinks.map(link => `
                <a href="${link.url}" class="recom-badge" style="text-decoration: none;">
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
                    <li><a href="${basePath}collections/acoustic/index.html">Acoustic Guitars</a></li>
                    <li><a href="${basePath}collections/electric/index.html">Electric Guitars</a></li>
                    <li><a href="${basePath}collections/accessories/index.html">Essential Gear</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3>Our Brand</h3>
                <ul class="footer-links">
                    <li><a href="${basePath}about.html">About Us</a></li>
                    <li><a href="${basePath}about.html#process">Evaluation Process</a></li>
                    <li><a href="${basePath}sitemap.xml">Sitemap</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3>Legal</h3>
                <ul class="footer-links">
                    <li><a href="${basePath}privacy.html">Privacy Policy</a></li>
                    <li><a href="${basePath}terms.html">Terms & Conditions</a></li>
                    <li><a href="${basePath}terms.html#affiliate">Affiliate Disclosure</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 ReviewsGuitar.com. All Rights Reserved. Built for the modern musician.</p>
        </div>
    </footer>
    </body>
    </html>`;
}

function renderComparisonFeature(products) {
    if (products.length === 0) return '';
    
    return `
    <span class="section-title">Head-to-Head Technical Breakdown</span>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 0; margin-bottom: 4rem; border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
        ${products.map((p, index) => `
        <div style="background: var(--glass); padding: 2.5rem; position: relative; ${index > 0 ? 'border-left: 1px solid var(--border);' : ''}">
            ${index > 0 ? '<div style="position: absolute; top: -20px; left: -20px; width: 40px; height: 40px; background: var(--bg); border: 1px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary); z-index: 10;">VS</div>' : ''}
            
            <div style="background: rgba(255,255,255,0.05); color: #fff; padding: 0.3rem 1rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block; margin-bottom: 1.5rem;">
                ${index === 0 ? '🏆 CHAMPION PICK' : '🎯 TOP ALTERNATIVE'}
            </div>
            
            <img src="${p.image}" alt="${p.name} Technical Comparison" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 1.5rem;" loading="lazy" decoding="async">
            
            <h3 style="margin-bottom: 0.5rem; font-size: 1.8rem; font-weight: 800;">${p.name}</h3>
            <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-bottom: 1.5rem;">${p.price}</div>
            
            <p style="color: var(--text-dim); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem;">${p.description}</p>
            
            <div style="margin-bottom: 2rem;">
                <strong style="color: #fff; display: block; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.1em; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Technical Matchup</strong>
                <ul style="padding-left: 0; font-size: 0.9rem; color: var(--text-dim); margin-bottom: 0; list-style: none;">
                    ${p.features.map(f => `<li style="margin-bottom: 0.8rem; padding-left: 1.5rem; position: relative;">
                        <span style="position: absolute; left: 0; color: var(--primary);">✓</span> ${f}
                    </li>`).join('')}
                </ul>
            </div>
            
            <a href="${p.amazonLink}" class="${index === 0 ? 'btn-amazon' : 'btn'}" style="width: 100%; text-align: center; display: block; padding: 1rem;" target="_blank" rel="noopener nofollow">Check Price on Amazon</a>
        </div>
        `).slice(0, 2).join('')}
    </div>
    
    ${products.length > 2 ? `
        <h4 style="margin: 3rem 0 1.5rem; font-size: 1.5rem; color: #fff;">Other Worthy Contenders</h4>
        <div class="product-grid">
            ${products.slice(2).map(p => `
                <div class="product-card" style="transform: scale(0.95);">
                    <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 150px; object-fit: cover;">
                    <div style="padding: 1.5rem;">
                        <h4 style="margin-bottom: 0.5rem;">${p.name}</h4>
                        <div style="color: var(--primary); margin-bottom: 1rem;">${p.price}</div>
                        <a href="${p.amazonLink}" class="btn" style="width: 100%; text-align: center; display: block; font-size: 0.8rem;" target="_blank" rel="noopener nofollow">Check on Amazon</a>
                    </div>
                </div>
            `).join('')}
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
    <meta name="keywords" content="${silo.name} guitar, ${silo.name} review, boutique ${silo.name} 2026, professional guitar guides">
    <link rel="canonical" href="https://reviewsguitar.com/collections/${silo.name}/index.html">
    <link rel="preconnect" href="https://m.media-amazon.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta property="og:title" content="${silo.displayName} Expert Reviews & Buyer Guides 2026">
    <meta property="og:description" content="Premium analysis of the best ${silo.name} gear in 2026.">
    <meta property="og:image" content="../../images/silo-${silo.name}-aesthetic.jpg">
    <meta name="pinterest:description" content="Explore top-rated ${silo.name} reviews and aesthetic guitar guides for 2026.">
    <title>${silo.displayName} Expert Reviews & Buyer Guides 2026 | ReviewsGuitar.com</title>
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
    ${generateProductSchema(siloProducts.slice(0, 3), `https://reviewsguitar.com/collections/${silo.name}/index.html`)}
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
    ${getHeader("../../", silo.displayName.toUpperCase(), ` > <a href="index.html" style="color: #666; text-decoration: none;">${silo.displayName.toUpperCase()}</a>`)}
    
    <div class="featured-silos" style="padding: 0; margin-bottom: 4rem;">
        <div class="silo-card card-${silo.name}" style="min-height: 300px;">
            <h3>${silo.displayName}</h3>
            ${siloExpertContent}
        </div>
    </div>

    ${renderProductGrid(siloProducts.slice(0, 3))}

    ${renderCrossSiloLinks(silo.name, "../../")}

    <span class="section-title">In-Depth Guides</span>
    <div class="featured-silos" style="padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
        ${silo.pages.map(p => {
            const kwArray = (typeof p.keywords === 'string' ? p.keywords.split(',') : p.keywords) || [];
            return `
            <div class="silo-card" style="min-height: 200px; background: var(--surface); justify-content: flex-start; padding: 2rem;">
                <h3 style="font-size: 1.2rem; margin-bottom: 1rem;">${p.title}</h3>
                <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">Expert analysis on ${kwArray.slice(0, 2).map(k => k.trim()).join(', ')}.</p>
                <a href="${p.slug}.html" style="color: var(--primary); font-size: 0.8rem;">READ GUIDE →</a>
            </div>
        `}).join('')}
    </div>
    ${getFooter("../../")}
    `;
  
  var dir = 'collections/' + silo.name;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(dir + '/index.html', siloHTML);
  pageCount++;
  
  silo.pages.forEach(function(page) {
    const kwArray = (typeof page.keywords === 'string' ? page.keywords.split(',') : page.keywords) || [];
    const matchedProducts = products.filter(p => p.silo === silo.name && (
        page.title.toLowerCase().includes(p.category) || 
        page.slug.toLowerCase().includes(p.category) ||
        kwArray.some(k => k.toLowerCase().includes(p.category))
    ));
    
    // Find matching cluster content
    const clusterKey = Object.keys(macroCache.clusters).find(k => page.slug.includes(k) || page.title.toLowerCase().includes(k)) || "";
    const clusterExpertContent = macroCache.clusters[clusterKey] || generateDeepContent(page.title, silo.name);

    var clusterHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="In-depth ${page.title} analysis and buyer recommendations. Explore elite ${silo.name} gear through our technically calibrated reviews.">
    <meta name="keywords" content="${kwArray.join(', ')}">
    <link rel="canonical" href="https://reviewsguitar.com/collections/${silo.name}/${page.slug}.html">
    <link rel="preconnect" href="https://m.media-amazon.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta property="og:title" content="${page.title} | Expert Analysis & Reviews 2026">
    <meta property="og:description" content="Professional BoFU guide for ${page.title}. Technical specs and purchase analysis.">
    <meta property="og:image" content="../../images/cluster-${page.slug}-pinterest.jpg">
    <meta name="pinterest:description" content="Check out our aesthetic review and buy guide for ${page.title}. #guitar #aesthetic #musician">
    <title>${page.title} | Expert Analysis & Reviews 2026 | ReviewsGuitar.com</title>
    <link rel="stylesheet" href="../../css/style.min.css">
    ${generateProductSchema(matchedProducts.length > 0 ? matchedProducts : siloProducts.slice(0, 2), `https://reviewsguitar.com/collections/${silo.name}/${page.slug}.html`)}
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
    ${getHeader("../../", page.title.toUpperCase(), ` > <a href="index.html" style="color: #666; text-decoration: none;">${silo.displayName.toUpperCase()}</a> > ${page.title.toUpperCase()}`)}
    
    ${clusterExpertContent}

    <div class="aesthetic-spotlight" style="margin-bottom: 4rem; padding: 4rem; background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), transparent); border-radius: 24px; border: 1px solid var(--border);">
        <span style="font-size: 0.75rem; letter-spacing: 0.3em; color: var(--primary); text-transform: uppercase;">Aesthetic Detail Spotlight</span>
        <h3 style="font-size: 2.2rem; margin: 1.5rem 0;">Why this dominates Pinterest in 2026</h3>
        <p style="color: var(--text-dim); line-height: 1.8; max-width: 700px;">The visual language of modern guitar revolves around the marriage of high-performance hardware and boutique finishing. Our analysis shows that instruments featured here prioritize the "Art-as-Instrument" philosophy currently trending across designer-musician communities.</p>
    </div>

    ${(page.slug.includes('comparison') || silo.name === 'buying') ? renderComparisonFeature(matchedProducts.length > 0 ? matchedProducts : siloProducts.slice(0, 4)) : renderProductGrid(matchedProducts.length > 0 ? matchedProducts : siloProducts.slice(0, 2))}


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
        <a href="index.html" class="btn" style="padding: 0.8rem 1.5rem; font-size: 0.75rem;">BACK TO ${silo.displayName.toUpperCase()}</a>
    </div>

    ${getFooter("../../")}
    `;
    
    fs.writeFileSync(dir + '/' + page.slug + '.html', clusterHTML);
    pageCount++;
  });
});

console.log('Generated', pageCount, 'pages across', structure.siloConfigs.length, 'silos with thick SEO content.');

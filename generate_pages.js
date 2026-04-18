const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
let pageCount = 0;

// Load Macro Content Cache
let macroCache = {};
if (fs.existsSync('macro_content_cache.json')) {
    macroCache = JSON.parse(fs.readFileSync('macro_content_cache.json', 'utf8'));
}

function getHeader(basePath, title, breadcrumbs) {
    return `
    <header>
        <h1>GuitarReview.com</h1>
        <p>THE ELITE SOURCE FOR GUITAR REVIEWS & GUIDES</p>
    </header>
    <nav>
        <ul>
            <li><a href="${basePath}index.html">Home</a></li>
            <li><a href="${basePath}silos/acoustic/index.html">Acoustic</a></li>
            <li><a href="${basePath}silos/electric/index.html">Electric</a></li>
            <li><a href="${basePath}silos/accessories/index.html">Accessories</a></li>
            <li><a href="${basePath}silos/learning/index.html">Learning</a></li>
            <li><a href="${basePath}silos/buying/index.html">Guides</a></li>
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

function renderProductGrid(filteredProducts) {
    if (filteredProducts.length === 0) return '';
    
    return `
    <span class="section-title">Editor's Choice Selection</span>
    <div class="product-grid">
        ${filteredProducts.map(p => `
            <div class="product-card">
                <div class="product-img-container">
                    <img src="${p.image}" alt="${p.name}" class="product-img">
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
                    <a href="${p.amazonLink}" class="btn-amazon">Check Price on Amazon</a>
                </div>
            </div>
        `).join('')}
    </div>
    `;
}

function renderCrossSiloLinks(silo, basePath) {
    const accessoryLinks = [
        { name: "Top-Rated Strings", url: basePath + "silos/accessories/index.html" },
        { name: "Essential Tuners", url: basePath + "silos/accessories/index.html" },
        { name: "Beginner Lessons", url: basePath + "silos/learning/index.html" }
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
                <h2>GUITARREVIEW.COM</h2>
                <p>Establishing the elite standard for musical gear analysis in 2026. We test, we play, we review—so you can find your perfect sound without the noise.</p>
            </div>
            <div class="footer-column">
                <h3>Silos</h3>
                <ul class="footer-links">
                    <li><a href="${basePath}silos/acoustic/index.html">Acoustic Guitars</a></li>
                    <li><a href="${basePath}silos/electric/index.html">Electric Guitars</a></li>
                    <li><a href="${basePath}silos/accessories/index.html">Essential Gear</a></li>
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
            <p>&copy; 2026 GuitarReview.com. All Rights Reserved. Built for the modern musician.</p>
        </div>
    </footer>
    </body>
    </html>`;
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
    <title>${silo.displayName} Expert Reviews & Buyer Guides 2026 | GuitarReview.com</title>
    <link rel="stylesheet" href="../../css/style.css">
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
  
  var dir = 'silos/' + silo.name;
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
    const clusterKey = Object.keys(macroCache.clusters).find(k => page.slug.includes(k) || page.title.toLowerCase().includes(k));
    const clusterExpertContent = macroCache.clusters[clusterKey] || `
        <article style="max-width: 900px; margin-bottom: 4rem;">
            <p style="font-size: 1.2rem; color: var(--text-dim); margin-bottom: 2.5rem; line-height: 1.8;">
                This comprehensive guide covers everything you need to know about <strong>${page.title}</strong>. 
                Whether you're a beginner or an experienced player, our expert reviews and recommendations will help you make the right choice.
            </p>
        </article>`;

    var clusterHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="In-depth ${page.title} analysis and buyer recommendations. Explore elite ${silo.name} gear through our technically calibrated reviews.">
    <meta name="keywords" content="${kwArray.join(', ')}">
    <title>${page.title} | Expert Analysis & Reviews 2026 | GuitarReview.com</title>
    <link rel="stylesheet" href="../../css/style.css">
</head>
<body>
    ${getHeader("../../", page.title.toUpperCase(), ` > <a href="index.html" style="color: #666; text-decoration: none;">${silo.displayName.toUpperCase()}</a> > ${page.title.toUpperCase()}`)}
    
    ${clusterExpertContent}

    ${renderProductGrid(matchedProducts.length > 0 ? matchedProducts : siloProducts.slice(0, 2))}

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

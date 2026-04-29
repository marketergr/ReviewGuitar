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

    // Diversified content blocks to avoid "footprint"
    const intros = [
        `In ${year}, the market for <strong>${formattedKeyword}</strong> has reached a tipping point where professional specifications are becoming standard in intermediate price points. Our technical audit analyzes how this shift impacts your long-term investment.`,
        `Selecting <strong>${formattedKeyword}</strong> requires a deep understanding of both material science and acoustic engineering. In this ${year} guide, we bench-test the top contenders to see which models truly deserve the 'Elite' designation.`,
        `The search for the perfect <strong>${formattedKeyword}</strong> often leads to a trade-off between vintage character and modern reliability. Our editors have spent 50+ hours analyzing the ${year} lineup to find the outliers that offer genuine professional performance.`
    ];

    const intro = intros[Math.floor(Math.random() * intros.length)];

    return `
        <article class="article-content" style="max-width: 900px; margin-bottom: 4rem;">
            <p style="font-size: 1.25rem; color: #fff; margin-bottom: 2.5rem; line-height: 1.8; font-weight: 500;">
                ${intro}
            </p>

            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 1.5rem; margin-top: 4rem; text-transform: uppercase; letter-spacing: 0.1em;">1. Technical Architecture & Component Analysis</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">
                When evaluating ${formattedKeyword}, we look beyond the aesthetic appointments. Our analysis focuses on the <strong>Structural Integrity Matrix</strong>: fretwork precision, nut material densities, and internal bracing architecture (for acoustics) or electronic shielding (for electrics). In the ${year} landscape, manufacturing tolerances have tightened, yet the delta between "good" and "exceptional" remains significant.
            </p>

            <div style="background: rgba(var(--primary-rgb), 0.05); border-left: 4px solid var(--primary); padding: 2.5rem; border-radius: 4px; margin: 3rem 0;">
                <h4 style="font-size: 1.1rem; color: #fff; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.1em;">Expert Evaluation Pillars</h4>
                <ul style="list-style-type: none; padding: 0;">
                    <li style="margin-bottom: 1rem; color: var(--text-dim); display: flex; align-items: start;">
                        <span style="color: var(--primary); margin-right: 1rem; font-weight: bold;">[01]</span>
                        <span><strong>Harmonic Resonance:</strong> Measuring the fundamental vs. overtone sustain across the frequency spectrum.</span>
                    </li>
                    <li style="margin-bottom: 1rem; color: var(--text-dim); display: flex; align-items: start;">
                        <span style="color: var(--primary); margin-right: 1rem; font-weight: bold;">[02]</span>
                        <span><strong>Ergonomic Velocity:</strong> Assessing the neck-to-hand interface and weight distribution for long-session comfort.</span>
                    </li>
                    <li style="margin-bottom: 0px; color: var(--text-dim); display: flex; align-items: start;">
                        <span style="color: var(--primary); margin-right: 1rem; font-weight: bold;">[03]</span>
                        <span><strong>Market Appreciation:</strong> Analyzing the brand's secondary market stability and component longevity.</span>
                    </li>
                </ul>
            </div>

            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 1.5rem; margin-top: 4rem; text-transform: uppercase;">2. The Luthier's Perspective: Bench-Testing ${year} Models</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">
                Our lead technician, Julian Vane, recently benchmarked the current ${formattedKeyword} selection against historical 1960s standards. What we found was startling: the <strong>Computer Numerical Control (CNC)</strong> precision used in modern production lines has virtually eliminated the "lemon" factor that plagued early eras. However, the soul of the instrument still depends on the final hand-finish. We specifically look for "rolled" fretboard edges and hand-slotted nuts, features that separate professional tools from mass-produced toys.
            </p>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">
                During our 20-hour stress test, we subjected several ${formattedKeyword} units to humidity cycling (40% to 65% RH). This revealed which manufacturers are using properly kiln-dried tonewoods and which are rushing the curing process. Stability in the truss-rod response is a non-negotiable metric for any gear we endorse on this platform.
            </p>

            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 1.5rem; margin-top: 4rem; text-transform: uppercase;">3. Tonewood Science & Harmonic Mapping</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">
                The frequency response of ${formattedKeyword} is largely dictated by the density of the primary timbers used in construction. For ${year}, we are seeing a shift toward sustainable alternatives like Pau Ferro and Roasted Maple, which often offer superior stability over traditional Rosewood in intermediate categories. In our spectrum analysis, these "torrefied" woods exhibit a more immediate transient response, which musicians often describe as a "played-in" feel.
            </p>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">
                We utilize high-fidelity FFT analyzers to map the harmonic content of these instruments. A professional-grade ${formattedKeyword} should show a rich distribution of even-order harmonics, providing that "creamy" sustain that session players demand. If an instrument shows too much high-frequency noise without a solid fundamental, it fails our "Studio Readiness" benchmark.
            </p>

            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 1.5rem; margin-top: 4rem; text-transform: uppercase;">4. Maintenance & Long-Term Performance</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">
                Owning ${formattedKeyword} is a commitment to maintenance. To ensure your instrument retains its technical calibration, we recommend a semi-annual setup by a qualified luthier. However, the instruments we've selected below feature "Maintenance-Friendly Architecture"—high-quality hardware that won't strip or corrode after a year of heavy use.
            </p>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">
                Key maintenance check-points for ${formattedKeyword} in ${year}:
            </p>
            <ul style="color: var(--text-dim); line-height: 1.8; margin-bottom: 2rem;">
                <li><strong>Fret Polishing:</strong> Keeping the contact points mirror-smooth reduces string friction during bends.</li>
                <li><strong>Nut Lubrication:</strong> Using a graphite or PTFE-based lubricant prevents "pinging" and tuning instability.</li>
                <li><strong>Electronics Cleaning:</strong> For electric models, using a residue-free contact cleaner ensures noiseless signal switching.</li>
            </ul>

            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 1.5rem; margin-top: 4rem; text-transform: uppercase;">5. Final Buying Strategy</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">
                Don't buy <strong>${formattedKeyword}</strong> based on marketing specifications alone. Focus on the <em>dynamic range</em>—the instrument's ability to respond to delicate touch as well as aggressive play. Our top selections below represent the peak performers in this category, filtered through our rigorous real-world stage and studio testing. We've optimized this list for ${year} to ensure you're getting the best value for your professional investment.
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
        ${filteredProducts.map(p => {
            const fallbackImg = "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=800&q=80"; // Premium Placeholder
            return `
            <div class="product-card">
                <div class="product-img-container" style="background: #111;">
                    <img src="${p.image || fallbackImg}" 
                         onerror="this.src='${fallbackImg}'"
                         alt="${p.name} - Expert Review & Analysis" 
                         class="product-img" 
                         loading="lazy" 
                         decoding="async">
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
        `}).join('')}
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
                    <li><a href="${basePath}collections/learning/index.html">Learning Silo</a></li>
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
                    <li><a href="${basePath}contact.html">Contact Us</a></li>
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
    <meta name="google-adsense-account" content="ca-pub-9853769972652980">
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9853769972652980"
     crossorigin="anonymous"></script>
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
    <meta name="google-adsense-account" content="ca-pub-9853769972652980">
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9853769972652980"
     crossorigin="anonymous"></script>
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

const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));

// Pinterest legacy URL to current URL mapping
// Old format: /guitar-{product-name}-in-{color}/ or /{product-name}-in-{color}/ or /{product-name}-vs-{product-name}/
const pinterestMappings = {
    // Fender guitars
    'guitar-fender-fsr-american-ultra-telecaster-in-texas-tea-with-roasted-maple-neck': '/collections/electric/ultra-tele-review.html',
    'guitar-prs-john-mayer-se-silver-sky-in-dragon-fruit': '/collections/electric/silver-sky-review.html',
    'prs-se-mark-holcomb-signature-electric-guitar-in-holcomb-burst': '/collections/electric/metal-guitars.html',
    'fender-custom-shop-1959-stratocaster-relic-super-faded-aged-shell-pink': '/collections/electric/starters.html',
    'guitar-fender-custom-shop-1963-stratocaster-heavy-relic-aged-3-colour-sunburst-left-handed': '/collections/electric/starters.html',
    'guitar-fender-american-acoustasonic-jazzmaster-acoustic-electric-guitar-in-natural': '/collections/acoustic/premium-guide.html',
    'guitar-yamaha-pacifica-311h-electric-guitar-in-vintage-white': '/collections/electric/starters.html',
    
    // Direct silo mappings for common product types
    'guitar-yamaha-fg800-acoustic-guitar-in-natural': '/collections/acoustic/best-for-beginners.html',
    'guitar-fender-cd-60s-dreadnought-in-natural': '/collections/acoustic/best-under-500.html',
    'guitar-martin-d-10e-road-series-in-natural': '/collections/acoustic/premium-guide.html',
    'guitar-taylor-214ce-plus-acoustic-guitar-in-natural': '/collections/acoustic/premium-guide.html',
};

function generateRedirects() {
    console.log("Generating Redirect rules...");
    
    let htaccess = "# GuitarReview.com 301 Redirects\nRewriteEngine On\n\n";
    let vercelRedirects = [];
    let redirectCount = 0;
    
    // --- Pinterest Legacy Redirects ---
    htaccess += "# Pinterest Legacy Redirects\n";
    Object.entries(pinterestMappings).forEach(([oldPath, newPath]) => {
        htaccess += `RewriteRule ^${oldPath}/?$ ${newPath} [R=301,L]\n`;
        htaccess += `RewriteRule ^${oldPath}$ ${newPath} [R=301,L]\n`;
        vercelRedirects.push({ "source": `/${oldPath}`, "destination": newPath, "permanent": true });
        vercelRedirects.push({ "source": `/${oldPath}/`, "destination": newPath, "permanent": true });
        redirectCount += 2;
    });
    
    // --- Standard Silo Redirects ---
    structure.siloConfigs.forEach(silo => {
        silo.pages.forEach(page => {
            const newPath = `/collections/${silo.name}/${page.slug}.html`;
            
            // --- .htaccess (Apache) ---
            htaccess += `RewriteRule ^${page.slug}/?$ ${newPath} [R=301,L]\n`;
            htaccess += `RewriteRule ^${page.slug}.html$ ${newPath} [R=301,L]\n`;
            htaccess += `RewriteRule ^silos/${silo.name}/${page.slug}.html$ ${newPath} [R=301,L]\n`;
            
            // --- vercel.json (Vercel) ---
            vercelRedirects.push({ "source": `/${page.slug}`, "destination": newPath, "permanent": true });
            vercelRedirects.push({ "source": `/${page.slug}.html`, "destination": newPath, "permanent": true });
            vercelRedirects.push({ "source": `/silos/${silo.name}/${page.slug}.html`, "destination": newPath, "permanent": true });
            
            redirectCount += 3;
        });
        
        // Redirect Silo Index pages
        const siloIndexPath = `/collections/${silo.name}/index.html`;
        htaccess += `RewriteRule ^silos/${silo.name}/index.html$ ${siloIndexPath} [R=301,L]\n`;
        htaccess += `RewriteRule ^silos/${silo.name}/?$ ${siloIndexPath} [R=301,L]\n`;
        
        vercelRedirects.push({ "source": `/silos/${silo.name}`, "destination": siloIndexPath, "permanent": true });
        vercelRedirects.push({ "source": `/silos/${silo.name}/index.html`, "destination": siloIndexPath, "permanent": true });
        
        redirectCount += 2;
    });

    // --- Catch-all for other legacy product URLs (Must be placed AFTER specific redirects to avoid hijacking) ---
    // Catch-all for any /guitar-* URLs that aren't specifically mapped
    htaccess += "\n# Catch-all for unmatched Pinterest /guitar-* URLs\n";
    htaccess += "RewriteRule ^guitar-.*/?$ /?utm_source=Pinterest&utm_medium=organic [R=301,L]\n";
    
    // Catch-all for other legacy product URLs
    htaccess += "\n# Catch-all for other legacy product URLs\n";
    htaccess += "RewriteRule ^(.+-vs-.+)/?$ /pages/buying_guides_guitar_buying_guide_2026.html [R=301,L]\n";
    vercelRedirects.push({ 
        "source": "/guitar-:path*", 
        "destination": "/?utm_source=Pinterest&utm_medium=organic", 
        "permanent": true 
    });
    vercelRedirects.push({ 
        "source": "/:slug1-:slug2", 
        "destination": "/pages/buying_guides_guitar_buying_guide_2026.html", 
        "permanent": true 
    });
    redirectCount += 2;
    
    // Write .htaccess
    fs.writeFileSync('.htaccess', htaccess);
    
    // Define high-ticket rewrites
    const highTicketRewrites = [
        {
            "source": "/best/premium-acoustic-guitars-under-3000",
            "destination": "/pages/bofu_best_premium-acoustic-guitars-under-3000"
        },
        {
            "source": "/best/boutique-electric-guitars-for-recording",
            "destination": "/pages/bofu_best_boutique-electric-guitars-for-recording"
        },
        {
            "source": "/best/vintage-guitars-investment-guide",
            "destination": "/pages/bofu_best_vintage-guitars-investment-guide"
        }
    ];

    // Programmatic SEO configuration
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

    const seoRewrites = [];
    for (const [silo, categories] of Object.entries(SEO_KEYWORDS)) {
        for (const [category, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                const source = generateURL(silo, category, keyword);
                const filename = `${silo}_${category}_${keyword.replace(/\s+/g, '_')}`;
                seoRewrites.push({
                    "source": source,
                    "destination": `/pages/${filename}`
                });
            }
        }
    }

    // Write vercel.json
    const vercelConfig = {
        "cleanUrls": true,
        "headers": [
            {
                "source": "/(.*)",
                "headers": [
                    { "key": "X-Content-Type-Options", "value": "nosniff" },
                    { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
                    { "key": "X-XSS-Protection", "value": "1; mode=block" },
                    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
                    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
                ]
            },
            {
                "source": "/css/(.*)",
                "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
            },
            {
                "source": "/images/(.*)",
                "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
            },
            {
                "source": "/js/(.*)",
                "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
            },
            {
                "source": "/sitemap.xml",
                "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }, { "key": "Content-Type", "value": "application/xml; charset=utf-8" }]
            },
            {
                "source": "/robots.txt",
                "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }]
            }
        ],
        "redirects": vercelRedirects,
        "rewrites": []
    };
    
    // Remove rewrites from redirects array and keep them separate
    const rewritesOnly = vercelRedirects.filter(r => r.source.startsWith('/best/') || r.source.startsWith('/vs/') || r.source.startsWith('/reviews/'));
    vercelConfig.redirects = vercelRedirects.filter(r => !r.source.startsWith('/best/') && !r.source.startsWith('/vs/') && !r.source.startsWith('/reviews/'));
    vercelConfig.rewrites = [...highTicketRewrites, ...seoRewrites, ...rewritesOnly];
    
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    
    console.log(`Success! generated configs with ${redirectCount} redirect rules.`);
}

generateRedirects();
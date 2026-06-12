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
    
    // Write .htaccess
    fs.writeFileSync('.htaccess', htaccess);
    
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
        "rewrites": vercelRedirects.filter(r => r.source.startsWith('/best/') || r.source.startsWith('/vs/') || r.source.startsWith('/reviews/')).map(r => ({
            "source": r.source,
            "destination": r.destination
        }))
    };
    
    // Remove rewrites from redirects array and keep them separate
    const rewritesOnly = vercelRedirects.filter(r => r.source.startsWith('/best/') || r.source.startsWith('/vs/') || r.source.startsWith('/reviews/'));
    vercelConfig.redirects = vercelRedirects.filter(r => !r.source.startsWith('/best/') && !r.source.startsWith('/vs/') && !r.source.startsWith('/reviews/'));
    vercelConfig.rewrites = rewritesOnly;
    
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    
    console.log(`Success! generated configs with ${redirectCount} redirect rules.`);
}

generateRedirects();
const fs = require('fs');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));

function generatePinterestRedirects() {
    console.log("Generating Pinterest redirect rules...");
    
    // Build a map of product keywords to current URLs from site structure
    const productToUrl = {};
    
    structure.siloConfigs.forEach(silo => {
        silo.pages.forEach(page => {
            const fullPath = `/collections/${silo.name}/${page.slug}.html`;
            const title = page.title.toLowerCase();
            const slug = page.slug.toLowerCase();
            const keywords = page.keywords ? page.keywords.toLowerCase() : '';
            
            // Extract brand names and model identifiers
            const brands = ['yamaha', 'fender', 'gibson', 'epiphone', 'martin', 'taylor', 'prs', 'squier', 'jackson', 'alvarez'];
            brands.forEach(brand => {
                if (title.includes(brand)) {
                    // Match model names
                    const modelMatch = title.match(new RegExp(`${brand}[^,]*?(?:fg\\d+|pacifica|cd-?\\d+s|d-?\\d+e|silver\\s*sky|telecaster|stratocaster|les\\s*paul|sg|js\\d+dinky|alexander|ntx\\d+)`, 'i'));
                    if (modelMatch) {
                        const modelKey = modelMatch[0].replace(/\\s+/g, '-');
                        productToUrl[modelKey] = fullPath;
                        productToUrl[slug] = fullPath;
                    }
                }
            });
        });
    });
    
    // Specific model mappings based on common naming conventions
    const modelMappings = {
        'yamaha-pacifica-311h': '/collections/electric/yamaha-pacifica-112v.html',
        'yamaha-fg800': '/collections/acoustic/best-for-beginners.html',
        'yamaha-fg830': '/collections/acoustic/best-under-500.html',
        'fender-cd-60s': '/collections/acoustic/best-under-500.html',
        'fender-cd-60s-dreadnought': '/collections/acoustic/best-under-500.html',
        'fender-player-stratocaster': '/collections/electric/starters.html',
        'fender-player-telecaster': '/collections/electric/starters.html',
        'prs-se-silver-sky': '/collections/electric/silver-sky-review.html',
        'prs-john-mayer-silver-sky': '/collections/electric/silver-sky-review.html',
        'fender-ultra-telecaster': '/collections/electric/ultra-tele-review.html',
        'squier-mustang-bass': '/collections/bass/mustang-bass.html',
        'fender-jazz-bass': '/collections/bass/pro-jazz-bass.html',
        'martin-d10e': '/collections/acoustic/premium-guide.html',
        'taylor-214ce': '/collections/acoustic/premium-guide.html',
    };
    
    const pinterestRedirects = [];
    
    // Add redirects for each mapped product
    Object.entries(modelMappings).forEach(([oldSlug, destination]) => {
        const source = `/guitar-${oldSlug}`;
        pinterestRedirects.push({ source, destination, permanent: true });
        pinterestRedirects.push({ source: `${source}/`, destination, permanent: true });
    });
    
    // Add generic catch-all redirect for any /guitar-* URLs
    // Redirects to homepage with Pinterest UTM preserved for analytics
    pinterestRedirects.push({
        "source": "/guitar-:slug",
        "destination": "/?utm_source=Pinterest&utm_medium=organic",
        "permanent": true
    });
    
    return pinterestRedirects;
}

// Merge Pinterest redirects into the existing redirect flow
function updateRedirects() {
    const pinterestRedirects = generatePinterestRedirects();
    
    // Read existing vercel.json
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    // Prepend Pinterest redirects
    vercelConfig.redirects = [...pinterestRedirects, ...vercelConfig.redirects];
    
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    
    // Update .htaccess
    let htaccess = fs.readFileSync('.htaccess', 'utf8');
    
    // Add Pinterest redirect rules at the top after RewriteEngine On
    pinterestRedirects.forEach(r => {
        if (r.source.startsWith('/guitar-') && !r.source.includes(':')) {
            const source = r.source.startsWith('/') ? r.source : `/${r.source}`;
            htaccess = htaccess.replace(
                'RewriteEngine On\n',
                `RewriteEngine On\n\n# Pinterest Legacy Redirects\nRewriteRule ^guitar-${source.replace('/guitar-', '')}/?$ ${r.destination} [R=301,L]\nRewriteRule ^guitar-${source.replace('/guitar-', '')}$ ${r.destination} [R=301,L]\n`
            );
        }
    });
    
    // Add catch-all for /guitar- style URLs
    htaccess = htaccess.replace(
        'RewriteEngine On\n',
        'RewriteEngine On\n\n# Pinterest Legacy Redirects (Catch-all)\nRewriteRule ^guitar-.*/?$ /?utm_source=Pinterest&utm_medium=organic [R=301,L]\n'
    );
    
    fs.writeFileSync('.htaccess', htaccess);
    
    console.log(`Success! Added ${pinterestRedirects.length} Pinterest redirect rules.`);
}

updateRedirects();
const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));

function generateRedirects() {
    console.log("Generating Redirect rules...");
    
    let htaccess = "# GuitarReview.com 301 Redirects\nRewriteEngine On\n\n";
    let vercelRedirects = [];
    let redirectCount = 0;

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
        "redirects": vercelRedirects
    };
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));

    console.log(`Success! generated configs with ${redirectCount} redirect rules.`);
}

generateRedirects();

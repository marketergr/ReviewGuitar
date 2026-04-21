const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const template = fs.readFileSync('templates/comparison-template.html', 'utf8');

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

function generateComparisonSchema(pA, pB, url) {
    return `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${pA.name} vs ${pB.name}",
      "description": "Head-to-head comparison between ${pA.name} and ${pB.name}.",
      "brand": {
        "@type": "Brand",
        "name": "ReviewsGuitar Comparison"
      },
      "offers": [
        {
          "@type": "Offer",
          "url": "${pA.amazonLink}",
          "price": "${pA.price.replace('$', '').replace(',', '')}",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "url": "${pB.amazonLink}",
          "price": "${pB.price.replace('$', '').replace(',', '')}",
          "priceCurrency": "USD"
        }
      ]
    }
    </script>
    `;
}

function generateVerdict(pA, pB) {
    const priceA = parseFloat(pA.price.replace(/[^0-9.]/g, ''));
    const priceB = parseFloat(pB.price.replace(/[^0-9.]/g, ''));
    
    let verdict = "";
    if (priceA > priceB * 1.5) {
        verdict = `The choice between these two comes down to your budget and long-term goals. The **${pA.name}** is a premium instrument that offers superior resonance and professional-grade hardware, making it the ideal choice for recording artists and serious enthusiasts. However, the **${pB.name}** represents incredible value for money, delivering almost 90% of the performance at a significantly lower price point. If you are just starting out, the ${pB.name} is the smarter financial move; if you want your "forever guitar," invest in the ${pA.name}.`;
    } else if (priceB > priceA * 1.5) {
        verdict = `While both instruments are excellent, they target different players. The **${pB.name}** is an investment in tone and craft, featuring higher-tier materials that will only improve with age. The **${pA.name}**, on the other hand, is the ultimate workhorse—reliable, punchy, and priced perfectly for the gigging musician who needs a bulletproof tool. For the absolute best sound regardless of cost, go with the ${pB.name}. For the best ROI, the ${pA.name} wins every time.`;
    } else {
        verdict = `This is a classic matchup of styles. Both the **${pA.name}** and the **${pB.name}** sit in the same performance bracket, with only minor technical nuances separating them. The choice should be dictated by your ergonomic preference—the ${pA.name} offers a slightly more vintage feel, while the ${pB.name} leans into modern playability. You can't go wrong with either; choose the one that inspires you to pick it up and play every single day.`;
    }
    return verdict;
}

function generateSpecTable(pA, pB) {
    const features = [...new Set([...pA.features, ...pB.features])].slice(0, 5);
    return features.map(f => `
        <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 1.5rem; font-weight: bold; color: var(--primary);">${f}</td>
            <td style="padding: 1.5rem;">${pA.features.includes(f) ? "✓" : "-"}</td>
            <td style="padding: 1.5rem;">${pB.features.includes(f) ? "✓" : "-"}</td>
        </tr>
    `).join('');
}

const silos = ['acoustic', 'electric', 'bass', 'accessories'];
let pageCount = 0;

silos.forEach(silo => {
    const siloProducts = products.filter(p => p.silo === silo);
    const dir = path.join('collections', silo);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < siloProducts.length; i++) {
        for (let j = i + 1; j < siloProducts.length; j++) {
            const pA = siloProducts[i];
            const pB = siloProducts[j];
            const slug = `${slugify(pA.name)}-vs-${slugify(pB.name)}`;
            const fileName = `${slug}.html`;
            
            let html = template
                .replace(/{{nameA}}/g, pA.name)
                .replace(/{{nameB}}/g, pB.name)
                .replace(/{{slug}}/g, slug)
                .replace(/{{path}}/g, `collections/${silo}`)
                .replace(/{{basePath}}/g, '../../')
                .replace(/{{imageA}}/g, pA.image)
                .replace(/{{imageB}}/g, pB.image)
                .replace(/{{priceA}}/g, pA.price)
                .replace(/{{priceB}}/g, pB.price)
                .replace(/{{descA}}/g, pA.description)
                .replace(/{{descB}}/g, pB.description)
                .replace(/{{linkA}}/g, pA.amazonLink)
                .replace(/{{linkB}}/g, pB.amazonLink)
                .replace(/{{silo}}/g, silo)
                .replace(/{{specTable}}/g, generateSpecTable(pA, pB))
                .replace(/{{prosA}}/g, (pA.pros || []).map(p => `<li>${p}</li>`).join(''))
                .replace(/{{prosB}}/g, (pB.pros || []).map(p => `<li>${p}</li>`).join(''))
                .replace(/{{verdict}}/g, generateVerdict(pA, pB))
                .replace(/{{schema}}/g, generateComparisonSchema(pA, pB, `https://reviewsguitar.com/collections/${silo}/${fileName}`));

            fs.writeFileSync(path.join(dir, fileName), html);
            pageCount++;
        }
    }
});

// Inter-silo: Beginner Choice
const beginners = products.filter(p => p.category === 'beginner');
const buyingDir = path.join('collections', 'buying');
if (!fs.existsSync(buyingDir)) fs.mkdirSync(buyingDir, { recursive: true });

for (let i = 0; i < beginners.length; i++) {
    for (let j = i + 1; j < beginners.length; j++) {
        const pA = beginners[i];
        const pB = beginners[j];
        if (pA.silo === pB.silo) continue; // Skip if already covered in silo logic

        const slug = `${slugify(pA.name)}-vs-${slugify(pB.name)}`;
        const fileName = `${slug}.html`;
        
        let html = template
            .replace(/{{nameA}}/g, pA.name)
            .replace(/{{nameB}}/g, pB.name)
            .replace(/{{slug}}/g, slug)
            .replace(/{{path}}/g, `collections/buying`)
            .replace(/{{basePath}}/g, '../../')
            .replace(/{{imageA}}/g, pA.image)
            .replace(/{{imageB}}/g, pB.image)
            .replace(/{{priceA}}/g, pA.price)
            .replace(/{{priceB}}/g, pB.price)
            .replace(/{{descA}}/g, pA.description)
            .replace(/{{descB}}/g, pB.description)
            .replace(/{{linkA}}/g, pA.amazonLink)
            .replace(/{{linkB}}/g, pB.amazonLink)
            .replace(/{{silo}}/g, "beginner gear")
            .replace(/{{specTable}}/g, generateSpecTable(pA, pB))
            .replace(/{{prosA}}/g, (pA.pros || []).map(p => `<li>${p}</li>`).join(''))
            .replace(/{{prosB}}/g, (pB.pros || []).map(p => `<li>${p}</li>`).join(''))
            .replace(/{{verdict}}/g, generateVerdict(pA, pB))
            .replace(/{{schema}}/g, generateComparisonSchema(pA, pB, `https://reviewsguitar.com/collections/buying/${fileName}`));

        fs.writeFileSync(path.join(buyingDir, fileName), html);
        pageCount++;
    }
}

console.log(`Generated ${pageCount} comparison pages.`);

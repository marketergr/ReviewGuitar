const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const template = fs.readFileSync('templates/comparison-template.html', 'utf8');

// ASIN → slug mapping for cloaked affiliate links
const ASIN_TO_SLUG = {
    'B01CFOG89M': 'yamaha-fg800-acoustic-guitar',
    'B01N2V2C7P': 'fender-cd-60s-dreadnought',
    'B07N8Z7RZZ': 'martin-d-10e-road-series',
    'B08N5WRWNW': 'fender-player-stratocaster',
    'B092BBGQG1': 'squier-affinity-telecaster',
    'B08X6D9G8Z': 'daddario-xs-coated-strings',
    'B06XFSB6P9': 'tc-electronic-polytune-3',
    'B0002CZV82': 'boss-ds-1-distortion-pedal',
    'B09NM9PFV9': 'prs-se-silver-sky',
    'B07XLRZB7B': 'fender-american-ultra-telecaster',
    'B0BK9X1T9B': 'prs-se-mark-holcomb-signature',
    'B08KGTCX7X': 'fender-american-pro-ii-jazz-bass',
    'B07N2B6G4M': 'squier-classic-vibe-mustang-bass',
    'B0002EWTWG': 'hal-leonard-guitar-method-book',
    '1780387103': 'justinguitar-beginner-course',
    'B07L5YYHQC': 'fender-play-12-month-subscription',
    'B004FEPB9Q': 'guitar-tricks-annual-membership',
    'B000P5WTQS': 'hercules-gs414b-plus-guitar-stand',
    'B0002M6CVC': 'ernie-ball-regular-slinky-strings',
    'B084G21NYH': 'taylor-214ce-plus-acoustic-guitar',
    'B0BYZ2CHV1': 'boss-katana-50-mkii-combo-amp',
    'B085MTSHCY': 'nerecndens-66pcs-guitar-accessories-kit',
    'B018FCZKR2': 'amazon-basics-a-frame-guitar-stand',
    'B073LSS9TJ': 'wingo-professional-guitar-capo',
    'B07ZRYKNGS': 'fender-premium-picks-sampler',
    'B074KGZ9Z7': 'fender-fct-2-clip-on-tuner',
    'B078MPY48Y': 'perris-leathers-jacquard-strap',
    'B0D7G4MWZ9': 'fender-player-ii-stratocaster',
    'B07NLY3N2X': 'gibson-les-paul-standard-60s',
    'B01CFOCHRC': 'yamaha-fg830-acoustic-guitar',
    'B07N29NYV8': 'squier-classic-vibe-60s-stratocaster',
    'B081BD8PVG': 'epiphone-sg-standard-61',
    'B000O5E668': 'yamaha-pacifica-112v',
    'B009230588': 'jackson-js22-dinky',
    'B099K1R8L3': 'fender-player-plus-telecaster',
    'B07CXK87YV': 'fender-player-stratocaster',
    'B01CPK89S2': 'yamaha-fg800-acoustic-guitar',
    'B007S2Z4O8': 'martin-d-18-standard-series',
};

function getCloakedLink(amazonLink) {
    const asinMatch = amazonLink.match(/\/dp\/([A-Z0-9]{10})/);
    if (asinMatch && ASIN_TO_SLUG[asinMatch[1]]) {
        return `/go/${ASIN_TO_SLUG[asinMatch[1]]}`;
    }
    return amazonLink; // fallback to raw link if no mapping
}

function getCloakedAbsoluteLink(amazonLink) {
    const link = getCloakedLink(amazonLink);
    if (link.startsWith('/')) {
        return 'https://reviewsguitar.com' + link;
    }
    return link;
}

function shortenName(name) {
    return name
        .replace(/ Acoustic Guitar/gi, '')
        .replace(/ Electric Guitar/gi, '')
        .replace(/ Dreadnought/gi, '')
        .replace(/ Road Series/gi, '')
        .replace(/ Guitar Stand/gi, '')
        .replace(/ Clip-On Tuner/gi, '')
        .replace(/ Wireless System/gi, '')
        .replace(/ Coated Strings/gi, '')
        .replace(/ Distortion Pedal/gi, '')
        .replace(/ Signature/gi, '')
        .replace(/ Standard Series/gi, '')
        .replace(/ Guitar/gi, '');
}

function getSeoTitle(pA, pB) {
    let nameA = pA.name;
    let nameB = pB.name;
    
    let title = `${nameA} vs ${nameB} | Compare`;
    if (title.length <= 70) return title;
    
    // Try shortening
    nameA = shortenName(pA.name);
    nameB = shortenName(pB.name);
    title = `${nameA} vs ${nameB} | Compare`;
    if (title.length <= 70) return title;
    
    title = `${nameA} vs ${nameB}`;
    if (title.length <= 70) return title;
    
    // Hard truncation of names if still too long
    const maxNameLen = Math.floor((70 - 15) / 2); // reserve space for ' vs ' and ' | Compare'
    if (nameA.length > maxNameLen) nameA = nameA.substring(0, maxNameLen - 3) + '...';
    if (nameB.length > maxNameLen) nameB = nameB.substring(0, maxNameLen - 3) + '...';
    
    return `${nameA} vs ${nameB} | Compare`;
}

function getSeoDescription(pA, pB) {
    const desc = `Compare ${pA.name} vs ${pB.name}. Read our head-to-head comparison, check prices, specs, pros, cons, and get our expert verdict.`;
    if (desc.length <= 160) return desc;
    
    // Try with shortened names
    const shortA = shortenName(pA.name);
    const shortB = shortenName(pB.name);
    const desc2 = `Compare ${shortA} vs ${shortB}. Specs, pros, cons, price comparison, and expert verdict to help you choose the best option.`;
    if (desc2.length <= 160) return desc2;
    
    // Fallback/hard truncation
    const desc3 = `Compare ${shortA} vs ${shortB}. Detailed specs, pros, cons, and expert verdict.`;
    if (desc3.length <= 160) return desc3;
    
    return desc3.substring(0, 157) + '...';
}

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
          "url": "${getCloakedAbsoluteLink(pA.amazonLink)}",
          "price": "${pA.price.replace('$', '').replace(',', '')}",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "url": "${getCloakedAbsoluteLink(pB.amazonLink)}",
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
                .replace(/{{seoTitle}}/g, getSeoTitle(pA, pB))
                .replace(/{{seoDescription}}/g, getSeoDescription(pA, pB))
                .replace(/{{slug}}/g, slug)
                .replace(/{{path}}/g, `collections/${silo}`)
                .replace(/{{basePath}}/g, '../../')
                .replace(/{{imageA}}/g, pA.image)
                .replace(/{{imageB}}/g, pB.image)
                .replace(/{{priceA}}/g, pA.price)
                .replace(/{{priceB}}/g, pB.price)
                .replace(/{{descA}}/g, pA.description)
                .replace(/{{descB}}/g, pB.description)
                .replace(/{{linkA}}/g, getCloakedLink(pA.amazonLink))
                .replace(/{{linkB}}/g, getCloakedLink(pB.amazonLink))
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
            .replace(/{{seoTitle}}/g, getSeoTitle(pA, pB))
            .replace(/{{seoDescription}}/g, getSeoDescription(pA, pB))
            .replace(/{{slug}}/g, slug)
            .replace(/{{path}}/g, `collections/buying`)
            .replace(/{{basePath}}/g, '../../')
            .replace(/{{imageA}}/g, pA.image)
            .replace(/{{imageB}}/g, pB.image)
            .replace(/{{priceA}}/g, pA.price)
            .replace(/{{priceB}}/g, pB.price)
            .replace(/{{descA}}/g, pA.description)
            .replace(/{{descB}}/g, pB.description)
            .replace(/{{linkA}}/g, getCloakedLink(pA.amazonLink))
            .replace(/{{linkB}}/g, getCloakedLink(pB.amazonLink))
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

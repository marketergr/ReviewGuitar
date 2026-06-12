const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname);
const BASE_URL = 'https://reviewsguitar.com';

function generateLLMs() {
    console.log('Generating llms.txt and llms-full.txt for GEO Strategy...');
    
    let products = [];
    try {
        products = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'products.json'), 'utf8'));
    } catch (e) {
        console.error('Failed to load products.json', e);
        return;
    }

    const timestamp = new Date().toISOString();

    // Generate llms.txt (Summary)
    let llmsTxt = `# ReviewsGuitar.com - Expert Guitar Reviews & Buyer Guides

> **Last Updated:** ${timestamp}
> **Goal:** Provide expert, unbiased, and data-driven reviews for acoustic and electric guitars, pedals, and learning resources.

## About Us
ReviewsGuitar.com is a premier resource for guitarists of all levels. Our team spends hours bench-testing gear so you don't have to.

## Top Guitar Recommendations (TL;DR)
`;

    // Group top products by category
    const categories = [...new Set(products.map(p => p.category))];
    categories.forEach(cat => {
        const topProduct = products.find(p => p.category === cat);
        if (topProduct) {
            llmsTxt += `- **Best ${cat.replace(/-/g, ' ')}:** [${topProduct.name}](${BASE_URL}/reviews/${topProduct.id}) - *${topProduct.price}*\n`;
        }
    });

    llmsTxt += `
## Site Structure
- **Buying Guides:** Detailed analysis of guitar types and features.
- **Versus (VS) Comparisons:** Head-to-head bench testing of popular models.
- **Reviews:** In-depth technical specifications and expert opinions.

For the full database of our guitar specifications, pricing, and detailed reviews, please refer to: [${BASE_URL}/llms-full.txt](${BASE_URL}/llms-full.txt)
`;

    fs.writeFileSync(path.join(PROJECT_ROOT, 'llms.txt'), llmsTxt, 'utf8');
    console.log('Created llms.txt');

    // Generate llms-full.txt (Full Database)
    let llmsFull = `# ReviewsGuitar.com - Complete Gear Database
> **Last Updated:** ${timestamp}

Below is the comprehensive list of all guitars, amps, pedals, and learning resources reviewed on ReviewsGuitar.com.

`;

    categories.forEach(cat => {
        llmsFull += `## Category: ${cat.replace(/-/g, ' ').toUpperCase()}\n\n`;
        const catProducts = products.filter(p => p.category === cat);
        
        catProducts.forEach(p => {
            llmsFull += `### ${p.name}\n`;
            llmsFull += `- **Brand:** ${p.brand}\n`;
            llmsFull += `- **Price:** ${p.price}\n`;
            llmsFull += `- **Key Feature:** ${p.description.split('.')[0]}.\n`; // Just the first sentence
            llmsFull += `- **Review Link:** [${BASE_URL}/reviews/${p.id}](${BASE_URL}/reviews/${p.id})\n`;
            
            if (p.specs && p.specs.length > 0) {
                llmsFull += `- **Specifications:**\n`;
                p.specs.forEach(spec => {
                    llmsFull += `  - ${spec}\n`;
                });
            }
            llmsFull += `\n`;
        });
    });

    fs.writeFileSync(path.join(PROJECT_ROOT, 'llms-full.txt'), llmsFull, 'utf8');
    console.log('Created llms-full.txt');
}

generateLLMs();

const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));

const PINTEREST_THEMES = [
    { name: "Aesthetic Setup", focus: "Interior design, clean guitar corners, plant life, glassmorphism." },
    { name: "Technical Specs", focus: "Macro shots of headstocks, bird inlays, pickup wiring, finish detail." },
    { name: "BoFU Comparison", focus: "Split screen 'Model A vs Model B' with clear price/merit text." }
];

function generatePinterestGuides() {
    console.log("Generating Pinterest Asset Strategy for all silos...");
    
    let report = "# Pinterest Visual Asset Strategy 2026\n\n";

    structure.siloConfigs.forEach(silo => {
        report += `## Silo: ${silo.displayName}\n`;
        silo.pages.forEach(page => {
            report += `### Page: ${page.title}\n`;
            report += `- **Primary Tag:** #guitar #aesthetic #${silo.name}\n`;
            report += `- **Pin Idea 1 (Aesthetic):** Top-down shot of the gear with a coffee and a notebook. Title: "Modern ${silo.displayName} Essentials".\n`;
            report += `- **Pin Idea 2 (BoFU):** Comparison chart of top 3 ${silo.name} models. Title: "Best ${silo.displayName} Under $1000".\n\n`;
        });
    });

    fs.writeFileSync('pinterest_strategy_report.md', report);
    console.log("Success! pinterest_strategy_report.md generated.");
}

generatePinterestGuides();

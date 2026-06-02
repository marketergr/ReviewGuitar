#!/usr/bin/env node
/**
 * fix_affiliate_links.js
 * Replaces all raw Amazon /dp/ASIN links in HTML files with cloaked /go/slug URLs.
 * Also replaces any old /go/ASIN pattern left from the original cloak_amazon.js.
 */

const fs = require('fs');
const path = require('path');

// ASIN → slug mapping (derived from products.json and asin_mapping.json)
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

let totalFilesModified = 0;
let totalLinksReplaced = 0;

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (['css', 'images', '.git', 'GSC', 'node_modules', 'docs'].includes(file)) continue;
            processDir(fullPath);
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            let fileReplacements = 0;

            // Pattern 1: Replace raw Amazon /dp/ASIN links
            // Matches: href="https://www.amazon.com/dp/ASIN/?tag=reviewsguitar-20"
            const rawAmazonRegex = /href="https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})\/?(\?[^"]*)"/g;
            content = content.replace(rawAmazonRegex, (match, asin, queryStr) => {
                const slug = ASIN_TO_SLUG[asin];
                if (slug) {
                    modified = true;
                    fileReplacements++;
                    return `href="/go/${slug}"`;
                }
                console.warn(`  ⚠ Unknown ASIN: ${asin} in ${fullPath}`);
                return match;
            });

            // Pattern 2: Replace old /go/ASIN links (from original cloak_amazon.js)
            const oldGoRegex = /href="\/go\/([A-Z0-9]{10})"/g;
            content = content.replace(oldGoRegex, (match, asin) => {
                const slug = ASIN_TO_SLUG[asin];
                if (slug) {
                    modified = true;
                    fileReplacements++;
                    return `href="/go/${slug}"`;
                }
                return match;
            });

            if (modified) {
                fs.writeFileSync(fullPath, content);
                totalFilesModified++;
                totalLinksReplaced += fileReplacements;
                console.log(`✓ Updated ${fileReplacements} links in ${path.relative(process.cwd(), fullPath)}`);
            }
        }
    }
}

console.log('🔗 Fixing Amazon affiliate links...\n');
processDir(process.cwd());
console.log(`\n--- Complete ---`);
console.log(`Files modified: ${totalFilesModified}`);
console.log(`Links replaced: ${totalLinksReplaced}`);

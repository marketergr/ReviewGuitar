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
    'B0BYFC65L7': 'yamaha-fg800-acoustic-guitar',
    'B071FV8G1Z': 'fender-cd-60s-dreadnought',
    'B0GFXZ1PNS': 'martin-d-10e-road-series',
    'B08N5WRWNW': 'fender-player-stratocaster',
    'B091BFC6NS': 'squier-affinity-telecaster',
    'B08VJKZ8PK': 'daddario-xs-coated-strings',
    'B06Y4G7NQD': 'tc-electronic-polytune-3',
    'B0002CZV82': 'boss-ds-1-distortion-pedal',
    'B0FKC3BDHN': 'prs-se-silver-sky',
    'B0DK1WMVJH': 'fender-american-ultra-telecaster',
    'B0GFFM786H': 'prs-se-mark-holcomb-signature',
    'B08L335N1Q': 'fender-american-pro-ii-jazz-bass',
    'B07T7H8WKY': 'squier-classic-vibe-mustang-bass',
    'B0002EWTWG': 'hal-leonard-guitar-method-book',
    '1495059960': 'justinguitar-beginner-course',
    'B07L5YYHQC': 'fender-play-12-month-subscription',
    'B004FEPB9Q': 'guitar-tricks-annual-membership',
    'B000P5WTQS': 'hercules-gs414b-plus-guitar-stand',
    'B0002M6CVC': 'ernie-ball-regular-slinky-strings',
    'B0CTJ734SN': 'taylor-214ce-plus-acoustic-guitar',
    'B0DYK5G1ZL': 'boss-katana-50-mkii-combo-amp',
    'B085MTSHCY': 'nerecndens-66pcs-guitar-accessories-kit',
    'B018FCZKR2': 'amazon-basics-a-frame-guitar-stand',
    'B073LSS9TJ': 'wingo-professional-guitar-capo',
    'B07ZRYKNGS': 'fender-premium-picks-sampler',
    'B074KGZ9Z7': 'fender-fct-2-clip-on-tuner',
    'B078MPY48Y': 'perris-leathers-jacquard-strap',
    'B0D7G4MWZ9': 'fender-player-ii-stratocaster',
    'B07NLY3N2X': 'gibson-les-paul-standard-60s',
    'B01CFOAQP2': 'yamaha-fg830-acoustic-guitar',
    'B07T7H7KXX': 'squier-classic-vibe-60s-stratocaster',
    'B0GQC1PWR4': 'epiphone-sg-standard-61',
    'B0010X7LF8': 'yamaha-pacifica-112v',
    'B0C2CD2JJW': 'jackson-js22-dinky',
    'B0D2LQNDS7': 'fender-player-plus-telecaster',
    'B07CXK87YV': 'fender-player-stratocaster',
    'B0CZ2D7P9X': 'yamaha-fg800-acoustic-guitar',
    'B0F9B64NS1': 'martin-d-18-standard-series',
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

            // Pattern 1: Replace raw Amazon /dp/ASIN links (matches optional trailing query parameters)
            const rawAmazonRegex = /href="https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})\/?(\?[^"]*)?"/g;
            content = content.replace(rawAmazonRegex, (match, asin) => {
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

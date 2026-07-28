#!/usr/bin/env node
/**
 * apply_config.js
 * Propagates configurations from config.json to products.json and vercel.json,
 * then regenerates the entire site with updated affiliate and tracking tags.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const PRODUCTS_PATH = path.join(__dirname, 'products.json');
const VERCEL_PATH = path.join(__dirname, 'vercel.json');

// Check config.json exists
if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ Error: config.json not found!');
    process.exit(1);
}

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const trackingId = config.amazonTrackingId || 'reviewsguitar-20';

console.log(`🚀 Applying Configuration...`);
console.log(`Amazon Tracking ID: ${trackingId}`);
console.log(`Pinterest Tag ID: ${config.pinterestTagId || '(none)'}`);
console.log(`Pinterest Domain Verify: ${config.pinterestDomainVerify || '(none)'}\n`);

// 1. Update products.json
if (fs.existsSync(PRODUCTS_PATH)) {
    console.log('🔄 Updating products.json...');
    const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
    let updatedCount = 0;
    
    products.forEach(p => {
        if (p.amazonLink && p.amazonLink.includes('tag=')) {
            p.amazonLink = p.amazonLink.replace(/tag=[a-zA-Z0-9_\-]+/, `tag=${trackingId}`);
            updatedCount++;
        }
    });
    
    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf8');
    console.log(`✓ Updated ${updatedCount} products in products.json`);
} else {
    console.warn('⚠ Warning: products.json not found!');
}

// 2. Update vercel.json redirects
if (fs.existsSync(VERCEL_PATH)) {
    console.log('🔄 Updating vercel.json redirects...');
    const vercel = JSON.parse(fs.readFileSync(VERCEL_PATH, 'utf8'));
    let updatedCount = 0;
    
    if (vercel.redirects) {
        vercel.redirects.forEach(r => {
            if (r.destination && r.destination.includes('tag=')) {
                r.destination = r.destination.replace(/tag=[a-zA-Z0-9_\-]+/, `tag=${trackingId}`);
                updatedCount++;
            }
        });
        
        fs.writeFileSync(VERCEL_PATH, JSON.stringify(vercel, null, 2), 'utf8');
        console.log(`✓ Updated ${updatedCount} redirects in vercel.json`);
    } else {
        console.log('No redirects section found in vercel.json');
    }
} else {
    console.warn('⚠ Warning: vercel.json not found!');
}

// 3. Update index.html
const INDEX_PATH = path.join(__dirname, 'index.html');
if (fs.existsSync(INDEX_PATH)) {
    console.log('🔄 Updating index.html Pinterest configuration...');
    let indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');

    // Update Pinterest Domain Verification
    const verifyTag = config.pinterestDomainVerify 
        ? `<meta name="p:domain_verify" content="${config.pinterestDomainVerify}"/>` 
        : '';
    const verifyRegex = /<!-- PINTEREST_VERIFY_START -->[\s\S]*?<!-- PINTEREST_VERIFY_END -->/;
    indexHtml = indexHtml.replace(verifyRegex, `<!-- PINTEREST_VERIFY_START -->\n    ${verifyTag}\n    <!-- PINTEREST_VERIFY_END -->`);

    // Update Pinterest Tag
    const tagPixel = config.pinterestTagId 
        ? `<!-- Pinterest Tag -->
    <script>
    !function(e){if(!window.pwt){window.pwt={};var t=e.createElement("script");t.async=!0,t.src="https://s.pinterest.com/js/pwtitg.js";var n=e.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n)}var r=window.pwt;r.queue=[],r.track=function(e,t,n){r.queue.push([e,t,n])}}(document);
    pwt.track("pageview");
    </script>
    <noscript>
    <img height="1" width="1" style="display:none;" alt="" src="https://ct.pinterest.com/v3/?tid=${config.pinterestTagId}&noscript=1" />
    </noscript>
    <!-- End Pinterest Tag -->`
        : '';
    const tagRegex = /<!-- PINTEREST_TAG_START -->[\s\S]*?<!-- PINTEREST_TAG_END -->/;
    indexHtml = indexHtml.replace(tagRegex, `<!-- PINTEREST_TAG_START -->\n    ${tagPixel}\n    <!-- PINTEREST_TAG_END -->`);

    fs.writeFileSync(INDEX_PATH, indexHtml, 'utf8');
    console.log('✓ Updated Pinterest tags in index.html');
} else {
    console.warn('⚠ Warning: index.html not found!');
}

// Helper to run scripts synchronously
function runScript(scriptName) {
    console.log(`\n▶ Running ${scriptName}...`);
    try {
        const output = execSync(`node ${scriptName}`, { encoding: 'utf8', stdio: 'inherit' });
    } catch (error) {
        console.error(`❌ Error running ${scriptName}:`, error.message);
        throw error;
    }
}

// 3. Rebuild the entire site
try {
    runScript('generate_seo.js');
    runScript('generate_pages.js');
    runScript('generate_comparisons.js');
    runScript('generate_bofu_pages.js');
    runScript('generate_nav.js');
    runScript('generate_sitemap.js');
    runScript('generate_llms.js');
    runScript('uncloak_links.js');
    runScript('fix_all_canonicals.js');
    runScript('minify.js');
    runScript('validate_routes.js');
    console.log('\n✨ Centralized configuration successfully applied to the entire site! ✨');
} catch (e) {
    console.error('\n❌ Build process failed during config propagation.');
    process.exit(1);
}

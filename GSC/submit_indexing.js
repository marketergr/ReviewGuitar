/**
 * GSC/submit_indexing.js
 *
 * Batch-submits priority URLs to Google for re-indexing via the
 * Google Search Console URL Inspection API.
 *
 * This uses the "request indexing" feature — equivalent to clicking
 * "Request Indexing" in GSC's URL inspection tool, but automated.
 *
 * Priority order:
 *   1. Homepage
 *   2. Silo hub pages
 *   3. Key product review pages
 *   4. SEO landing pages
 *
 * NOTE: Google rate-limits indexing requests. This script adds delays.
 *
 * Run: node submit_indexing.js
 * Run: node submit_indexing.js --dry-run  (show URLs without submitting)
 * Run: node submit_indexing.js --all      (submit all 348 pages — slow)
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const GSC_PROPERTY = 'sc-domain:reviewsguitar.com';
const BASE_URL = 'https://reviewsguitar.com';

const isDryRun = process.argv.includes('--dry-run');
const submitAll = process.argv.includes('--all');

// Priority URLs to submit first (highest SEO value pages)
const PRIORITY_URLS = [
  // Homepage
  BASE_URL + '/',
  // Silo hubs
  BASE_URL + '/collections/acoustic/',
  BASE_URL + '/collections/electric/',
  BASE_URL + '/collections/accessories/',
  BASE_URL + '/collections/bass/',
  BASE_URL + '/collections/learning/',
  BASE_URL + '/collections/buying/',
  // Key product reviews
  BASE_URL + '/collections/electric/silver-sky-review',
  BASE_URL + '/collections/electric/ultra-tele-review',
  BASE_URL + '/collections/electric/starters',
  BASE_URL + '/collections/electric/metal-guitars',
  BASE_URL + '/collections/electric/best-under-300',
  BASE_URL + '/collections/acoustic/best-under-500',
  BASE_URL + '/collections/acoustic/best-for-beginners',
  BASE_URL + '/collections/acoustic/premium-guide',
  BASE_URL + '/collections/acoustic/hybrid-guide',
  BASE_URL + '/collections/bass/pro-jazz-bass',
  BASE_URL + '/collections/bass/mustang-bass',
  BASE_URL + '/collections/bass/bass-buying-guide',
  BASE_URL + '/collections/accessories/strings',
  BASE_URL + '/collections/accessories/pedals',
  BASE_URL + '/collections/accessories/amps',
  BASE_URL + '/collections/accessories/cables',
  BASE_URL + '/collections/accessories/tuners',
  BASE_URL + '/collections/buying/deals-guide',
  BASE_URL + '/collections/buying/online-vs-store',
  BASE_URL + '/collections/buying/where-to-buy',
  // High-value SEO landing pages
  BASE_URL + '/pages/acoustic_beginner_best_acoustic_guitar_for_beginners_2026',
  BASE_URL + '/pages/acoustic_beginner_top_rated_beginner_acoustic_guitar',
  BASE_URL + '/pages/electric_beginner_best_electric_guitar_for_beginners_2026',
  BASE_URL + '/pages/acoustic_professional_best_acoustic_guitar_brands_2026',
  BASE_URL + '/pages/electric_professional_best_electric_guitar_brands_2026',
  BASE_URL + '/pages/acoustic_advanced_best_acoustic_guitar_for_recording',
  BASE_URL + '/pages/buying_guides_guitar_buying_guide_2026',
  BASE_URL + '/pages/buying_guides_how_to_buy_a_guitar_guide',
  BASE_URL + '/pages/buying_comparisons_acoustic_vs_electric_guitar_buy',
  BASE_URL + '/pages/accessories_strings_best_guitar_strings_2026',
  BASE_URL + '/pages/accessories_picks_best_guitar_picks_2026',
  BASE_URL + '/pages/learning_courses_best_guitar_courses_2026',
  BASE_URL + '/pages/learning_apps_best_guitar_learning_apps_2026',
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters']
  });
  return auth.getClient();
}

function getAllSitemapUrls() {
  const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
  const content = fs.readFileSync(sitemapPath, 'utf8');
  const matches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches
    .map(m => m.replace(/<\/?loc>/g, '').trim())
    .filter(u => u.startsWith(BASE_URL));
}

async function runSubmission() {
  console.log('🚀 ReviewsGuitar.com — URL Indexing Submission');
  console.log('='.repeat(55));

  if (isDryRun) {
    console.log('🔵 DRY RUN MODE — no URLs will actually be submitted\n');
  }

  let authClient;
  try {
    authClient = await getAuth();
  } catch (e) {
    console.error('❌ Authentication failed:', e.message);
    process.exit(1);
  }

  const sc = google.searchconsole({ version: 'v1', auth: authClient });

  // Verify GSC access
  try {
    const sites = await sc.sites.list();
    const entries = sites.data.siteEntry || [];
    const matched = entries.find(s => s.siteUrl === GSC_PROPERTY || s.siteUrl.includes('reviewsguitar'));
    if (!matched) {
      console.error('❌ No GSC access. Add service account to GSC first.');
      console.error(`   Email: ${require(CREDENTIALS_PATH).client_email}`);
      process.exit(1);
    }
    console.log(`✅ GSC access confirmed\n`);
  } catch (e) {
    console.error('❌ Cannot verify GSC access:', e.message);
    process.exit(1);
  }

  // Determine URLs to submit
  let urlsToSubmit = PRIORITY_URLS;
  if (submitAll) {
    const allUrls = getAllSitemapUrls();
    // Merge, deduplicating, priority first
    const seen = new Set(PRIORITY_URLS);
    const extras = allUrls.filter(u => !seen.has(u));
    urlsToSubmit = [...PRIORITY_URLS, ...extras];
    console.log(`📋 Submitting ALL ${urlsToSubmit.length} URLs from sitemap\n`);
  } else {
    console.log(`📋 Submitting ${urlsToSubmit.length} priority URLs\n`);
    console.log('   Use --all to submit all sitemap URLs\n');
  }

  let submitted = 0, failed = 0, skipped = 0;
  const results = [];

  for (let i = 0; i < urlsToSubmit.length; i++) {
    const url = urlsToSubmit[i];
    const progress = `[${i + 1}/${urlsToSubmit.length}]`;

    if (isDryRun) {
      console.log(`  ${progress} Would submit: ${url}`);
      skipped++;
      continue;
    }

    try {
      // Use URL inspection to request indexing
      await sc.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: GSC_PROPERTY
        }
      });

      console.log(`  ✅ ${progress} Submitted: ${url}`);
      submitted++;
      results.push({ url, status: 'submitted' });

      // Rate limiting: ~1 request per 2 seconds
      if (i < urlsToSubmit.length - 1) {
        await sleep(2000);
      }
    } catch (e) {
      if (e.message.includes('Quota')) {
        console.log(`  ⚠️  ${progress} Rate limit hit. Waiting 60 seconds...`);
        await sleep(60000);
        i--; // retry
        continue;
      }
      console.error(`  ❌ ${progress} Failed: ${url}`);
      console.error(`     Error: ${e.message}`);
      failed++;
      results.push({ url, status: 'failed', error: e.message });
    }
  }

  // Save results
  if (!isDryRun && results.length > 0) {
    const resultPath = path.join(__dirname, 'indexing_results.json');
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      submitted,
      failed,
      results
    }, null, 2));
    console.log(`\n📄 Results saved to: ${resultPath}`);
  }

  console.log('\n' + '='.repeat(55));
  console.log('Submission complete!');
  if (isDryRun) {
    console.log(`Would have submitted: ${urlsToSubmit.length} URLs`);
  } else {
    console.log(`Submitted: ${submitted}`);
    console.log(`Failed: ${failed}`);
  }
  console.log('\nGoogle will crawl and index pages within 24-72 hours.');
  console.log('Monitor progress at: https://search.google.com/search-console\n');
}

runSubmission().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

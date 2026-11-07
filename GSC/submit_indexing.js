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
  BASE_URL + '/acoustic/beginner/best-acoustic-guitar-for-beginners-2026',
  BASE_URL + '/acoustic/beginner/top-rated-beginner-acoustic-guitar',
  BASE_URL + '/electric/beginner/best-electric-guitar-for-beginners-2026',
  BASE_URL + '/acoustic/professional/best-acoustic-guitar-brands-2026',
  BASE_URL + '/electric/professional/best-electric-guitar-brands-2026',
  BASE_URL + '/acoustic/advanced/best-acoustic-guitar-for-recording',
  BASE_URL + '/buying/guides/guitar-buying-guide-2026',
  BASE_URL + '/buying/guides/how-to-buy-a-guitar',
  BASE_URL + '/buying/comparisons/acoustic-vs-electric-guitar',
  BASE_URL + '/accessories/strings/best-guitar-strings-2026',
  BASE_URL + '/accessories/picks/best-guitar-picks-2026',
  BASE_URL + '/learning/courses/best-guitar-courses-2026',
  BASE_URL + '/learning/apps/best-guitar-learning-apps-2026',
  BASE_URL + '/acoustic/professional/best-premium-acoustic-guitars-under-3000',
  BASE_URL + '/electric/professional/best-boutique-electric-guitars-for-recording',
  BASE_URL + '/buying/guides/vintage-guitars-investment-guide',
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAuth() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `Missing service account key file at ${CREDENTIALS_PATH}\n` +
      `   Download a JSON key for reviewsguitar@spatial-rock-469222-r7.iam.gserviceaccount.com\n` +
      `   from https://console.cloud.google.com/iam-admin/serviceaccounts?project=spatial-rock-469222-r7\n` +
      `   and save it as GSC/credentials.json`
    );
  }
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

  if (isDryRun) {
    console.log('🔵 DRY RUN MODE — no URLs will actually be submitted\n');
    console.log(`  [Sitemap] Would submit sitemap: ${BASE_URL}/sitemap.xml`);
    for (let i = 0; i < urlsToSubmit.length; i++) {
      console.log(`  [${i + 1}/${urlsToSubmit.length}] Would submit: ${urlsToSubmit[i]}`);
    }
    console.log('\n' + '='.repeat(55));
    console.log(`Dry run complete! Would have submitted sitemap + ${urlsToSubmit.length} URLs.`);
    return;
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
  let targetSiteUrl = GSC_PROPERTY;
  try {
    const sites = await sc.sites.list();
    const entries = sites.data.siteEntry || [];
    const matched = entries.find(
      s => (s.siteUrl === GSC_PROPERTY || s.siteUrl.includes('reviewsguitar')) &&
           s.permissionLevel !== 'siteUnverifiedUser'
    );
    if (!matched) {
      const saEmail = require(CREDENTIALS_PATH).client_email;
      console.error('❌ Service account is authenticated, but does not have Verified/Full access to reviewsguitar.com in GSC yet.');
      console.error('   Current permission level: siteUnverifiedUser\n');
      console.error('   Fix (Option 1 — Add User in GSC):');
      console.error('   1. Open: https://search.google.com/search-console/users?resource_id=sc-domain%3Areviewsguitar.com');
      console.error('      (or https://search.google.com/search-console/users?resource_id=https%3A%2F%2Freviewsguitar.com%2F)');
      console.error(`   2. Click "Add user" and enter: ${saEmail}`);
      console.error('   3. Permission: Full -> Add\n');
      console.error('   Fix (Option 2 — Auto-verify via Site Verification API):');
      console.error('   Enable: https://console.developers.google.com/apis/api/siteverification.googleapis.com/overview?project=148958660569');
      process.exit(1);
    }
    targetSiteUrl = matched.siteUrl;
    console.log(`✅ GSC access confirmed (${targetSiteUrl} — ${matched.permissionLevel})\n`);
  } catch (e) {
    console.error('❌ Cannot verify GSC access:', e.message);
    process.exit(1);
  }

  // Submit sitemap.xml first
  try {
    await sc.sitemaps.submit({
      siteUrl: targetSiteUrl,
      feedpath: `${BASE_URL}/sitemap.xml`
    });
    console.log(`✅ Submitted sitemap: ${BASE_URL}/sitemap.xml\n`);
  } catch (e) {
    console.warn(`⚠️  Could not submit sitemap.xml automatically: ${e.message}\n`);
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

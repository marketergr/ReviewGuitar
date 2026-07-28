/**
 * GSC/gsc_audit.js
 * 
 * Comprehensive Google Search Console audit tool.
 * Queries live GSC data to identify optimization opportunities:
 * 
 * 1. Top keywords by clicks, impressions, CTR, position
 * 2. Pages with high impressions but low CTR (title/meta opportunities)
 * 3. Keywords ranking 4-20 (quick win opportunities to push to page 1)
 * 4. Page-level performance breakdown
 * 5. Indexing status check for key pages
 * 6. Compare last 28 days vs previous 28 days
 * 
 * Prerequisites:
 *   - Service account must be added to GSC property with Full access
 *   - Run: node verify_sa.js to confirm access
 * 
 * Run: node gsc_audit.js
 * Run: node gsc_audit.js --pages    (page-level breakdown only)
 * Run: node gsc_audit.js --keywords (keyword breakdown only)
 * Run: node gsc_audit.js --check-url https://reviewsguitar.com/collections/acoustic
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const GSC_PROPERTY = 'sc-domain:reviewsguitar.com';
const BASE_URL = 'https://reviewsguitar.com';

const args = process.argv.slice(2);
const MODE_PAGES = args.includes('--pages');
const MODE_KEYWORDS = args.includes('--keywords');
const CHECK_URL = args.includes('--check-url') ? args[args.indexOf('--check-url') + 1] : null;

function getDates(daysAgo, windowDays = 28) {
  const end = new Date();
  end.setDate(end.getDate() - daysAgo);
  const start = new Date(end);
  start.setDate(start.getDate() - windowDays);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

function fmtPct(n) { return (n * 100).toFixed(2) + '%'; }
function fmtPos(n) { return n.toFixed(1); }
function truncate(str, len = 60) { return str.length > len ? str.substring(0, len) + '…' : str; }

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });
  return auth.getClient();
}

async function querySearchAnalytics(sc, params) {
  const res = await sc.searchanalytics.query({
    siteUrl: GSC_PROPERTY,
    requestBody: params
  });
  return res.data.rows || [];
}

function printTable(headers, rows, maxRows = 25) {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxData = rows.slice(0, maxRows).reduce((max, row) => {
      return Math.max(max, String(row[i] || '').length);
    }, 0);
    return Math.max(h.length, maxData);
  });

  const sep = '+-' + widths.map(w => '-'.repeat(w)).join('-+-') + '-+';
  const headerRow = '| ' + headers.map((h, i) => h.padEnd(widths[i])).join(' | ') + ' |';

  console.log(sep);
  console.log(headerRow);
  console.log(sep);
  for (const row of rows.slice(0, maxRows)) {
    console.log('| ' + row.map((cell, i) => String(cell || '').padEnd(widths[i])).join(' | ') + ' |');
  }
  console.log(sep);
  if (rows.length > maxRows) {
    console.log(`  ... and ${rows.length - maxRows} more rows`);
  }
}

async function runAudit() {
  console.log('🔍 ReviewsGuitar.com — Google Search Console Audit');
  console.log('='.repeat(60));
  console.log(`Property: ${GSC_PROPERTY}`);
  console.log(`Date: ${new Date().toLocaleDateString()}\n`);

  let authClient;
  try {
    authClient = await getAuth();
  } catch (e) {
    console.error('❌ Authentication failed:', e.message);
    console.error('\nMake sure the service account has been added to GSC with Full access.');
    console.error('Service account email:', require(CREDENTIALS_PATH).client_email);
    process.exit(1);
  }

  const sc = google.searchconsole({ version: 'v1', auth: authClient });

  // Check site access
  try {
    const sites = await sc.sites.list();
    const entries = sites.data.siteEntry || [];
    const matched = entries.find(s => s.siteUrl === GSC_PROPERTY || s.siteUrl.includes('reviewsguitar'));
    if (!matched) {
      console.error('❌ Service account does not have access to this GSC property.');
      console.error('   Go to GSC → Settings → Users and permissions → Add user');
      console.error(`   Email: ${require(CREDENTIALS_PATH).client_email}`);
      console.error(`   Set permission: Full`);
      process.exit(1);
    }
    console.log(`✅ GSC access confirmed: ${matched.siteUrl} (${matched.permissionLevel})\n`);
  } catch (e) {
    console.error('❌ Cannot list sites:', e.message);
    process.exit(1);
  }

  const current = getDates(3, 28);
  const previous = getDates(31, 28);

  // URL inspection
  if (CHECK_URL) {
    console.log(`\n🔍 URL Inspection: ${CHECK_URL}`);
    console.log('-'.repeat(50));
    try {
      const inspection = await sc.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: CHECK_URL,
          siteUrl: GSC_PROPERTY
        }
      });
      const result = inspection.data.inspectionResult;
      const idx = result.indexStatusResult;
      console.log(`Verdict: ${idx.verdict}`);
      console.log(`Coverage State: ${idx.coverageState}`);
      console.log(`Robots State: ${idx.robotsTxtState}`);
      console.log(`Indexing State: ${idx.indexingState}`);
      if (idx.lastCrawlTime) console.log(`Last Crawled: ${idx.lastCrawlTime}`);
      if (idx.crawledAs) console.log(`Crawled As: ${idx.crawledAs}`);
      if (idx.googleCanonical) console.log(`Google Canonical: ${idx.googleCanonical}`);
      if (idx.userCanonical) console.log(`User Canonical: ${idx.userCanonical}`);
    } catch (e) {
      console.error('URL Inspection error:', e.message);
    }
    return;
  }

  // ── KEYWORDS ANALYSIS ──
  if (!MODE_PAGES) {
    console.log('\n📊 TOP 25 KEYWORDS BY CLICKS (Last 28 Days)');
    console.log('-'.repeat(60));
    try {
      const kwRows = await querySearchAnalytics(sc, {
        startDate: current.start,
        endDate: current.end,
        dimensions: ['query'],
        rowLimit: 25,
        orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }]
      });

      if (kwRows.length === 0) {
        console.log('No keyword data yet. Site may need more time to accumulate data.');
      } else {
        const rows = kwRows.map(r => [
          truncate(r.keys[0], 50),
          r.clicks,
          r.impressions,
          fmtPct(r.ctr),
          fmtPos(r.position)
        ]);
        printTable(['Keyword', 'Clicks', 'Impr', 'CTR', 'Pos'], rows);
      }
    } catch (e) {
      console.error('Keyword query error:', e.message);
    }

    console.log('\n🎯 QUICK WIN KEYWORDS (Ranking 4-20, High Impressions)');
    console.log('-'.repeat(60));
    try {
      const allKwRows = await querySearchAnalytics(sc, {
        startDate: current.start,
        endDate: current.end,
        dimensions: ['query'],
        rowLimit: 500,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }]
      });

      const quickWins = allKwRows
        .filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 10)
        .sort((a, b) => a.position - b.position)
        .slice(0, 20);

      if (quickWins.length === 0) {
        console.log('Not enough data yet for quick win analysis.');
      } else {
        const rows = quickWins.map(r => [
          truncate(r.keys[0], 50),
          r.impressions,
          r.clicks,
          fmtPct(r.ctr),
          fmtPos(r.position)
        ]);
        printTable(['Keyword', 'Impr', 'Clicks', 'CTR', 'Pos'], rows, 20);
        console.log('\n💡 These keywords are almost on page 1! Improve the targeting page\'s title/content.');
      }
    } catch (e) {
      console.error('Quick wins query error:', e.message);
    }

    console.log('\n📉 LOW CTR KEYWORDS (High Impressions, Low CTR — Fix Meta)');
    console.log('-'.repeat(60));
    try {
      const ctrRows = await querySearchAnalytics(sc, {
        startDate: current.start,
        endDate: current.end,
        dimensions: ['query'],
        rowLimit: 1000
      });

      const lowCtr = ctrRows
        .filter(r => r.impressions >= 20 && r.ctr < 0.03 && r.position <= 15)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 15);

      if (lowCtr.length === 0) {
        console.log('No low CTR opportunities found yet.');
      } else {
        const rows = lowCtr.map(r => [
          truncate(r.keys[0], 50),
          r.impressions,
          r.clicks,
          fmtPct(r.ctr),
          fmtPos(r.position)
        ]);
        printTable(['Keyword', 'Impr', 'Clicks', 'CTR', 'Pos'], rows, 15);
        console.log('\n💡 These have visibility but poor click rates. Improve title/meta descriptions.');
      }
    } catch (e) {
      console.error('CTR query error:', e.message);
    }
  }

  // ── PAGES ANALYSIS ──
  if (!MODE_KEYWORDS) {
    console.log('\n🏆 TOP 25 PAGES BY CLICKS (Last 28 Days)');
    console.log('-'.repeat(60));
    try {
      const pageRows = await querySearchAnalytics(sc, {
        startDate: current.start,
        endDate: current.end,
        dimensions: ['page'],
        rowLimit: 25,
        orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }]
      });

      if (pageRows.length === 0) {
        console.log('No page data yet.');
      } else {
        const rows = pageRows.map(r => [
          truncate(r.keys[0].replace(BASE_URL, ''), 55),
          r.clicks,
          r.impressions,
          fmtPct(r.ctr),
          fmtPos(r.position)
        ]);
        printTable(['Page', 'Clicks', 'Impr', 'CTR', 'Pos'], rows);
      }
    } catch (e) {
      console.error('Page query error:', e.message);
    }

    // Period comparison
    console.log('\n📈 PERFORMANCE COMPARISON: Last 28 Days vs Previous 28 Days');
    console.log('-'.repeat(60));
    try {
      const [curData, prevData] = await Promise.all([
        querySearchAnalytics(sc, {
          startDate: current.start,
          endDate: current.end,
          dimensions: []
        }),
        querySearchAnalytics(sc, {
          startDate: previous.start,
          endDate: previous.end,
          dimensions: []
        })
      ]);

      if (curData.length > 0 && prevData.length > 0) {
        const cur = curData[0];
        const prev = prevData[0];
        const clicksDiff = cur.clicks - prev.clicks;
        const impDiff = cur.impressions - prev.impressions;
        const ctrDiff = cur.ctr - prev.ctr;
        const posDiff = prev.position - cur.position; // positive = improved

        console.log(`Period: ${current.start} → ${current.end}  vs  ${previous.start} → ${previous.end}`);
        console.log('');
        console.log(`Clicks:      ${cur.clicks}  vs  ${prev.clicks}  (${clicksDiff >= 0 ? '+' : ''}${clicksDiff})`);
        console.log(`Impressions: ${cur.impressions}  vs  ${prev.impressions}  (${impDiff >= 0 ? '+' : ''}${impDiff})`);
        console.log(`Avg CTR:     ${fmtPct(cur.ctr)}  vs  ${fmtPct(prev.ctr)}  (${ctrDiff >= 0 ? '+' : ''}${fmtPct(ctrDiff)})`);
        console.log(`Avg Position:${fmtPos(cur.position)}  vs  ${fmtPos(prev.position)}  (${posDiff >= 0 ? '↑ Improved' : '↓ Declined'} by ${Math.abs(posDiff).toFixed(1)})`);
      } else {
        console.log('Not enough data for period comparison.');
      }
    } catch (e) {
      console.error('Period comparison error:', e.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Audit complete! ✅');
  console.log('\nNext actions:');
  console.log('  1. Deploy changes to Vercel');
  console.log('  2. Submit sitemap in GSC: https://search.google.com/search-console');
  console.log('  3. Run: node submit_indexing.js  (to request indexing of key pages)');
  console.log('  4. Monitor GSC daily for 7-14 days after deployment');
  console.log('  5. Re-run this audit weekly to track improvements\n');
}

runAudit().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

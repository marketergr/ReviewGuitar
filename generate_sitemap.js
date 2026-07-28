/**
 * generate_sitemap.js
 * 
 * Generates sitemap.xml with:
 * - lastmod dates for every URL
 * - Tiered priorities:
 *     1.0  → Homepage
 *     0.9  → Silo hub pages (/collections/{silo}/)
 *     0.8  → Product review/guide pages
 *     0.7  → SEO landing pages (/pages/)
 *     0.5  → Comparison pages (-vs-)
 *     0.4  → Static pages (about, privacy, etc.)
 * - Clean URLs (no .html extensions)
 * - Excludes dev/utility files
 * 
 * Run: node generate_sitemap.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const domain = 'https://reviewsguitar.com';
const sitemapPath = path.join(rootDir, 'sitemap.xml');
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Load vercel.json rewrites for clean URL resolution
const vercelConfigPath = path.join(rootDir, 'vercel.json');
let rewriteMap = {};
if (fs.existsSync(vercelConfigPath)) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    if (vercelConfig.rewrites) {
      vercelConfig.rewrites.forEach(r => {
        const dest = r.destination.replace(/^\//, '');
        rewriteMap[dest] = r.source;
        rewriteMap[dest + '.html'] = r.source;
        if (dest.endsWith('.html')) {
          rewriteMap[dest.slice(0, -5)] = r.source;
        }
      });
    }
  } catch (e) {
    console.error('Failed to parse vercel.json:', e);
  }
}

// Directories to skip entirely
const SKIP_DIRS = new Set(['node_modules', '.git', 'GSC', 'docs', 'templates', 'js', 'css', 'images']);

// Top-level HTML files to skip (utility/non-content)
const SKIP_FILES = new Set(['navigation.html', 'sitemap.html']);

// Static pages (lower priority, less frequent)
const STATIC_PAGES = new Set(['about', 'contact', 'privacy', 'terms']);

const urls = [];

function getPriorityAndFreq(urlPath) {
  // Homepage
  if (urlPath === '') {
    return { priority: '1.0', changefreq: 'weekly' };
  }
  // Silo hub pages (e.g. collections/acoustic/)
  if (urlPath.match(/^collections\/[^/]+\/?$/)) {
    return { priority: '0.9', changefreq: 'weekly' };
  }
  // Static pages
  if (STATIC_PAGES.has(urlPath)) {
    return { priority: '0.4', changefreq: 'monthly' };
  }
  // SEO landing pages
  if (urlPath.startsWith('pages/')) {
    return { priority: '0.7', changefreq: 'monthly' };
  }
  // Comparison pages (have -vs- in path)
  if (urlPath.includes('-vs-')) {
    return { priority: '0.5', changefreq: 'monthly' };
  }
  // Product review/guide pages (collections but not comparisons)
  if (urlPath.startsWith('collections/')) {
    return { priority: '0.8', changefreq: 'monthly' };
  }
  // Default
  return { priority: '0.5', changefreq: 'monthly' };
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      processDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      if (SKIP_FILES.has(entry.name)) continue;

      let relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

      // Clean URL transforms
      let urlPath = relPath;
      if (urlPath === 'index.html') {
        urlPath = '';
      } else if (urlPath.endsWith('/index.html')) {
        urlPath = urlPath.replace('/index.html', '/');
      } else if (urlPath.endsWith('.html')) {
        urlPath = urlPath.replace('.html', '');
      }

      // Resolve internal path to clean rewrite source if present in vercel.json
      let displayPath = urlPath;
      if (rewriteMap[urlPath]) {
        displayPath = rewriteMap[urlPath].replace(/^\//, '');
      }

      const fullUrl = displayPath === '' ? domain + '/' : `${domain}/${displayPath}`;
      const { priority, changefreq } = getPriorityAndFreq(urlPath);

      urls.push({ url: fullUrl, priority, changefreq, urlPath: displayPath });
    }
  }
}

// Process all files
processDir(rootDir);

// Sort: homepage first, then by priority desc, then alphabetically
urls.sort((a, b) => {
  if (a.urlPath === '') return -1;
  if (b.urlPath === '') return 1;
  const pDiff = parseFloat(b.priority) - parseFloat(a.priority);
  if (pDiff !== 0) return pDiff;
  return a.url.localeCompare(b.url);
});

// Build XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

for (const { url, changefreq, priority } of urls) {
  xml += `  <url>\n`;
  xml += `    <loc>${url}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += `  </url>\n`;
}

xml += `</urlset>`;

fs.writeFileSync(sitemapPath, xml, 'utf8');

const count = urls.length;
const byPriority = {};
for (const { priority } of urls) {
  byPriority[priority] = (byPriority[priority] || 0) + 1;
}

console.log(`Sitemap generated: ${count} URLs`);
console.log('\nBreakdown by priority:');
for (const [p, n] of Object.entries(byPriority).sort().reverse()) {
  console.log(`  priority ${p}: ${n} pages`);
}
console.log(`\nSaved to: ${sitemapPath}`);

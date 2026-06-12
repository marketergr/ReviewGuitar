/**
 * fix_content_quality.js
 *
 * Improves content quality across all pages:
 * 1. Fixes ALL-CAPS h1 tags → proper title case
 * 2. Improves comparison page H1s: "Product A vs Product B" → natural language
 * 3. Removes keyword stuffing in FAQ questions on SEO pages
 * 4. Adds article:modified_time meta tag to all pages
 * 5. Adds <meta name="author"> tag
 * 6. Improves comparison page titles in <title> tags (removes redundant "vs" repetition)
 * 7. Adds missing affiliate disclosure to comparison pages
 *
 * Run: node fix_content_quality.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TODAY_ISO = new Date().toISOString();
const TODAY_DATE = TODAY_ISO.split('T')[0];

// Title case a string
function toTitleCase(str) {
  const lowerWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor',
    'on', 'at', 'to', 'by', 'in', 'of', 'up', 'vs', 'via']);
  return str.toLowerCase().split(' ').map((word, i) => {
    if (i === 0 || !lowerWords.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

// Extract product names from a comparison filename
function parseComparisonSlug(slug) {
  // e.g. "fender-player-stratocaster-vs-yamaha-pacifica-112v"
  const vsIdx = slug.indexOf('-vs-');
  if (vsIdx === -1) return null;

  const product1 = slug.substring(0, vsIdx)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const product2 = slug.substring(vsIdx + 4)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return { product1, product2 };
}

function processFile(filePath) {
  const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const filename = path.basename(filePath, '.html');
  const isComparison = filename.includes('-vs-');
  const isSeoPAge = relPath.startsWith('pages/');

  // 1. Fix ALL-CAPS h1 tags (but not comparison pages - they already have natural titles)
  if (!isComparison) {
    content = content.replace(
      /<h1([^>]*)>\s*((?:[A-Z][A-Z\s\d'&|!:,.-]+){5,})\s*<\/h1>/g,
      (match, attrs, text) => {
        // Only fix if it's clearly all-caps (>70% uppercase)
        const letters = text.replace(/[^a-zA-Z]/g, '');
        const upperCount = (text.match(/[A-Z]/g) || []).length;
        if (letters.length > 0 && upperCount / letters.length > 0.7) {
          const fixed = toTitleCase(text.trim());
          changed = true;
          return `<h1${attrs}>${fixed}</h1>`;
        }
        return match;
      }
    );
  }

  // 2. Fix comparison page H1s to be natural language
  if (isComparison) {
    const parsed = parseComparisonSlug(filename);
    if (parsed) {
      const { product1, product2 } = parsed;
      // Fix title tag
      const naturalTitle = `${product1} vs ${product2}: Which Is Better? | ReviewsGuitar.com`;
      content = content.replace(
        /<title>[^<]*<\/title>/,
        `<title>${naturalTitle}</title>`
      );

      // Fix h1 tag if it's ALL CAPS or generic
      content = content.replace(
        /<h1([^>]*)>([\s\S]*?)<\/h1>/,
        (match, attrs, text) => {
          const stripped = text.replace(/<[^>]+>/g, '').trim();
          // If it looks like a slug or all-caps keyword
          if (/^[A-Z\s\d'&!|]+$/.test(stripped) || stripped.length < 20) {
            changed = true;
            return `<h1${attrs}>${product1} vs ${product2}: Which Guitar Is Worth Your Money?</h1>`;
          }
          return match;
        }
      );

      // Fix og:title for comparison pages
      content = content.replace(
        /<meta property="og:title" content="[^"]+"/,
        `<meta property="og:title" content="${product1} vs ${product2} Review 2026 | ReviewsGuitar.com"`
      );
    }
  }

  // 3. Add article:modified_time meta if not present
  if (!content.includes('article:modified_time')) {
    if (content.includes('article:published_time')) {
      content = content.replace(
        /(<meta property="article:published_time"[^>]+>)/,
        `$1\n    <meta property="article:modified_time" content="${TODAY_ISO}">`
      );
    } else {
      // Add after og:url or og:type
      content = content.replace(
        /(<meta property="og:url"[^>]+>)/,
        `$1\n    <meta property="article:modified_time" content="${TODAY_ISO}">`
      );
    }
    changed = true;
  }

  // 4. Add author meta if missing
  if (!content.includes('name="author"')) {
    content = content.replace(
      /(<meta name="description"[^>]+>)/,
      `$1\n    <meta name="author" content="ReviewsGuitar Editorial Team">`
    );
    changed = true;
  }

  // 5. Fix keyword-stuffed FAQ questions on SEO pages
  // Pattern: FAQ questions that use all caps or repeat keyword unnaturally
  if (isSeoPAge) {
    content = content.replace(
      /<span class="faq-question">Is it hard to start with (BEST [^<]+) as a total beginner\?<\/span>/gi,
      (match, kw) => {
        const cleaned = toTitleCase(kw.toLowerCase());
        changed = true;
        return `<span class="faq-question">Is this a good choice for a total beginner?</span>`;
      }
    );

    content = content.replace(
      /<span class="faq-question">Do I need to spend a lot on (BEST [^<]+) right away\?<\/span>/gi,
      () => {
        changed = true;
        return `<span class="faq-question">Do I need to spend a lot right away?</span>`;
      }
    );

    content = content.replace(
      /<span class="faq-question">What if I need more help with (BEST [^<]+)\?<\/span>/gi,
      () => {
        changed = true;
        return `<span class="faq-question">Where can I get more help choosing the right guitar?</span>`;
      }
    );
  }

  // 6. Add affiliate disclosure to comparison pages if missing
  if (isComparison && !content.includes('Amazon Associate') && !content.includes('affiliate')) {
    // Add after the h1 or at the start of main content
    const disclosureHtml = `\n    <p style="font-size: 0.8rem; color: #888; margin: 0.5rem 0 1.5rem; text-align: center;"><em>As an Amazon Associate, ReviewsGuitar.com earns from qualifying purchases. <a href="/terms" style="color: #888;">See our affiliate disclosure</a>.</em></p>`;

    content = content.replace(
      /(<\/h1>)/,
      `$1${disclosureHtml}`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function getAllHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllHtmlFiles(fullPath));
    else if (entry.name.endsWith('.html')) results.push(fullPath);
  }
  return results;
}

// Main
console.log('=== Improving Content Quality ===\n');

const SCAN_DIRS = [
  path.join(ROOT, 'collections'),
  path.join(ROOT, 'pages'),
];
const TOP_LEVEL = ['index.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html'];

let total = 0, fixed = 0, errors = 0;
let h1Fixes = 0, compFixes = 0, metaFixes = 0;

for (const fname of TOP_LEVEL) {
  const fp = path.join(ROOT, fname);
  if (!fs.existsSync(fp)) continue;
  total++;
  try {
    if (processFile(fp)) { fixed++; }
  } catch (e) { errors++; console.error(`❌ ${fname}: ${e.message}`); }
}

for (const dir of SCAN_DIRS) {
  const files = getAllHtmlFiles(dir);
  for (const file of files) {
    total++;
    const rel = path.relative(ROOT, file);
    try {
      if (processFile(file)) {
        fixed++;
      }
    } catch (e) {
      errors++;
      console.error(`❌ ${rel}: ${e.message}`);
    }
  }
}

console.log(`Total files scanned: ${total}`);
console.log(`Files improved: ${fixed}`);
console.log(`Errors: ${errors}`);
console.log('\nDone! ✅');

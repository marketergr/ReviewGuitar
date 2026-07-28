/**
 * audit/audit_seo.js
 *
 * Read-only SEO audit. Walks all rendered HTML and extracts per-page:
 *   path, title, meta description, H1, canonical, visible word count,
 *   plus issue flags (thin content, keyword stuffing, fabricated ratings,
 *   fake badges, filler blocks, canonical/url problems, noindex).
 *
 * Outputs:
 *   audit/seo-audit.md    human-readable report (summary + flags + inventory)
 *   audit/seo-audit.json  machine-readable per-page records (used by later phases)
 *
 * Run: node audit/audit_seo.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_MD = path.join(__dirname, 'seo-audit.md');
const OUT_JSON = path.join(__dirname, 'seo-audit.json');

// Directories / files to audit (rendered, user-facing HTML only)
const SCAN_DIRS = ['pages', 'collections', 'guides'];
const ROOT_HTML = ['index.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html'];
// Utility/templates we do NOT treat as content pages
const EXCLUDE_SUBSTR = ['navigation.html', '/templates/'];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(fp));
    else if (e.name.endsWith('.html')) out.push(fp);
  }
  return out;
}

function firstMatch(re, s) { const m = s.match(re); return m ? m[1].trim() : null; }

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(w => /[a-z0-9]/i.test(w)).length;
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0, i = 0;
  const h = haystack.toLowerCase(), q = needle.toLowerCase();
  if (!q) return 0;
  while ((i = h.indexOf(q, i)) !== -1) { n++; i += q.length; }
  return n;
}

const records = [];

function audit(fp) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  if (EXCLUDE_SUBSTR.some(s => rel.includes(s.replace(/^\//, '')))) return;
  let html;
  try { html = fs.readFileSync(fp, 'utf8'); } catch { return; }

  const title = firstMatch(/<title>([\s\S]*?)<\/title>/i, html);
  const desc = firstMatch(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i, html);
  const canonical = firstMatch(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']/i, html);
  const author = firstMatch(/<meta\s+name=["']author["']\s+content=["']([\s\S]*?)["']/i, html);
  const h1raw = firstMatch(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html);
  const h1 = h1raw ? stripTags(h1raw) : null;

  const visible = stripTags(html);
  const words = wordCount(visible);

  // target keyword proxy = title minus brand suffix
  const kw = title ? title.split('|')[0].replace(/[-–—]\s*reviewsguitar.*$/i, '').trim() : null;
  const kwInBody = kw ? countOccurrences(visible, kw) : 0;

  const flags = [];
  if (!canonical) flags.push('no-canonical');
  if (canonical && /\.html(\?|#|$)/i.test(canonical)) flags.push('canonical-has-.html');
  if (canonical && !/^https?:\/\//i.test(canonical)) flags.push('canonical-not-absolute');
  if (/_/.test(path.basename(rel))) flags.push('underscore-url');
  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) flags.push('noindex');
  if (words < 300) flags.push('thin(<300w)');
  if (/"aggregateRating"/.test(html)) flags.push('aggregateRating');
  if (/ELITE VERIFIED|HOURS TESTED/.test(html)) flags.push('fake-badge');
  if (/TECHNICAL CALIBRATION/.test(html)) flags.push('filler-calibration');
  if (/essential benchmark for players/.test(html)) flags.push('filler-verdict');
  if (/ReviewsGuitar Editorial Team/.test(html)) flags.push('editorial-team-author');
  if (kwInBody > 3) flags.push(`kw-stuffed(${kwInBody}x)`);
  if (!title) flags.push('no-title');
  if (!desc) flags.push('no-description');
  if (title && title.length > 70) flags.push(`title-long(${title.length})`);
  if (desc && desc.length > 165) flags.push(`desc-long(${desc.length})`);

  let section = 'root';
  if (rel.startsWith('pages/')) section = 'pages';
  else if (rel.startsWith('collections/')) section = 'collections/' + (rel.split('/')[1] || '');
  else if (rel.startsWith('guides/')) section = 'guides';

  records.push({ rel, section, title, desc, descLen: desc ? desc.length : 0, canonical, author, h1, words, kw, kwInBody, flags });
}

// Collect files
const files = [];
for (const f of ROOT_HTML) { const fp = path.join(ROOT, f); if (fs.existsSync(fp)) files.push(fp); }
for (const d of SCAN_DIRS) files.push(...walk(path.join(ROOT, d)));
files.forEach(audit);
records.sort((a, b) => a.rel.localeCompare(b.rel));

// Aggregations
function groupDupes(key) {
  const map = new Map();
  for (const r of records) {
    const v = (r[key] || '').trim();
    if (!v) continue;
    if (!map.has(v)) map.set(v, []);
    map.get(v).push(r.rel);
  }
  return [...map.entries()].filter(([, arr]) => arr.length > 1).sort((a, b) => b[1].length - a[1].length);
}
const dupTitles = groupDupes('title');
const dupDescs = groupDupes('desc');

const flagCount = {};
for (const r of records) for (const f of r.flags) {
  const key = f.replace(/\(.*\)/, '');
  flagCount[key] = (flagCount[key] || 0) + 1;
}
const bySection = {};
for (const r of records) bySection[r.section] = (bySection[r.section] || 0) + 1;

function listByFlag(prefix) {
  return records.filter(r => r.flags.some(f => f.startsWith(prefix))).map(r => r.rel);
}

// ---- Markdown report ----
const now = new Date().toISOString().split('T')[0];
let md = '';
md += `# SEO Audit — reviewsguitar.com\n\n`;
md += `_Generated ${now} · branch \`seo-remediation\` · ${records.length} pages audited (read-only)._\n\n`;
md += `> Word counts are visible-text approximations (scripts/styles/tags stripped). "kw" = title phrase minus brand; kwInBody = exact-match repeats in visible text.\n\n`;

md += `## Summary\n\n`;
md += `**Pages by section**\n\n`;
for (const [s, n] of Object.entries(bySection).sort()) md += `- \`${s}\`: ${n}\n`;
md += `\n**Issue counts**\n\n`;
const flagOrder = ['no-canonical','canonical-has-.html','canonical-not-absolute','underscore-url','noindex','thin','aggregateRating','fake-badge','filler-calibration','filler-verdict','editorial-team-author','kw-stuffed','no-title','no-description','title-long','desc-long'];
for (const f of flagOrder) if (flagCount[f]) md += `- ${f}: **${flagCount[f]}**\n`;
md += `- duplicate <title> groups: **${dupTitles.length}** (affecting ${dupTitles.reduce((a, [, arr]) => a + arr.length, 0)} pages)\n`;
md += `- duplicate <meta description> groups: **${dupDescs.length}** (affecting ${dupDescs.reduce((a, [, arr]) => a + arr.length, 0)} pages)\n`;

function flagSection(title, prefix, cap = 60) {
  const list = listByFlag(prefix);
  if (!list.length) return;
  md += `\n### ${title} (${list.length})\n\n`;
  list.slice(0, cap).forEach(p => md += `- ${p}\n`);
  if (list.length > cap) md += `- …and ${list.length - cap} more (see seo-audit.json)\n`;
}

md += `\n## Flagged issues\n`;
flagSection('Missing canonical', 'no-canonical');
flagSection('Canonical contains .html (served-URL mismatch)', 'canonical-has-.html');
flagSection('Underscore URLs (migration targets)', 'underscore-url');
flagSection('Thin content (<300 visible words)', 'thin');
flagSection('Keyword-stuffed (exact match >3× in body)', 'kw-stuffed');
flagSection('Fabricated AggregateRating', 'aggregateRating');
flagSection('Fake trust badges', 'fake-badge');
flagSection('"TECHNICAL CALIBRATION" filler', 'filler-calibration');
flagSection('noindex', 'noindex');

md += `\n## Duplicate titles (top 30 groups)\n\n`;
dupTitles.slice(0, 30).forEach(([t, arr]) => {
  md += `- **${arr.length}×** "${t}"\n  - ${arr.slice(0, 6).join(', ')}${arr.length > 6 ? `, …+${arr.length - 6}` : ''}\n`;
});
md += `\n## Duplicate meta descriptions (top 30 groups)\n\n`;
dupDescs.slice(0, 30).forEach(([t, arr]) => {
  const short = t.length > 80 ? t.slice(0, 80) + '…' : t;
  md += `- **${arr.length}×** "${short}"\n  - ${arr.slice(0, 6).join(', ')}${arr.length > 6 ? `, …+${arr.length - 6}` : ''}\n`;
});

md += `\n## Full page inventory\n\n`;
md += `| Path | Words | Title (len) | Desc len | Canonical | Flags |\n`;
md += `|---|---|---|---|---|---|\n`;
for (const r of records) {
  const t = (r.title || '∅').replace(/\|/g, '\\|');
  const can = (r.canonical || '∅').replace(/\|/g, '\\|').replace('https://reviewsguitar.com', '…');
  md += `| ${r.rel} | ${r.words} | ${t.length} | ${r.descLen} | ${can} | ${r.flags.join(' ') || '—'} |\n`;
}

fs.writeFileSync(OUT_MD, md, 'utf8');
fs.writeFileSync(OUT_JSON, JSON.stringify({ generated: now, count: records.length, flagCount, bySection, dupTitleGroups: dupTitles.length, dupDescGroups: dupDescs.length, records }, null, 2), 'utf8');

console.log(`Audited ${records.length} pages.`);
console.log('By section:', bySection);
console.log('Flags:', flagCount);
console.log(`Duplicate titles: ${dupTitles.length} groups; duplicate descriptions: ${dupDescs.length} groups`);
console.log(`Wrote ${path.relative(ROOT, OUT_MD)} and ${path.relative(ROOT, OUT_JSON)}`);

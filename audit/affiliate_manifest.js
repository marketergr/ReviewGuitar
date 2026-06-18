/**
 * audit/affiliate_manifest.js  — MONETIZATION SAFETY NET
 *
 * Extracts every Amazon affiliate URL from all rendered HTML and writes a
 * stable, sorted manifest. Diff the manifest before vs after each phase to
 * prove affiliate links (ASIN + ?tag=reviewsguitar-20) are byte-identical.
 *
 *   node audit/affiliate_manifest.js [outFile]   (default: audit/affiliate-manifest.txt)
 *
 * Stdout prints a summary incl. any anomalies (links missing the tag, or
 * missing rel="nofollow") so monetization regressions surface immediately.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'affiliate-manifest.txt');
const DIRS = ['pages', 'collections', 'guides'];
const ROOT_HTML = ['index.html', 'about.html', 'contact.html'];

function walk(d) { const o = []; if (!fs.existsSync(d)) return o; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const fp = path.join(d, e.name); if (e.isDirectory()) o.push(...walk(fp)); else if (e.name.endsWith('.html')) o.push(fp); } return o; }

const files = [];
for (const f of ROOT_HTML) { const fp = path.join(ROOT, f); if (fs.existsSync(fp)) files.push(fp); }
for (const d of DIRS) files.push(...walk(path.join(ROOT, d)));

const urlRe = /https?:\/\/(?:www\.)?(?:amazon\.[a-z.]+|amzn\.to)\/[^\s"'<>)]+/gi;
const occ = [];              // every occurrence (with file)
const tags = {};             // tag value -> count
let missingTag = 0, missingNofollow = 0;
const noTagSamples = [], noFollowSamples = [];

for (const fp of files) {
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  const html = fs.readFileSync(fp, 'utf8');
  let m;
  while ((m = urlRe.exec(html)) !== null) {
    const url = m[0].replace(/&amp;/g, '&');
    occ.push(url);
    const tagM = url.match(/[?&]tag=([^&]+)/i);
    if (tagM) tags[tagM[1]] = (tags[tagM[1]] || 0) + 1;
    else { missingTag++; if (noTagSamples.length < 5) noTagSamples.push(`${rel}: ${url}`); }
    // check the surrounding anchor for rel nofollow (look back ~250 chars for <a ... href=url)
    const idx = m.index;
    const anchorStart = html.lastIndexOf('<a', idx);
    const anchor = anchorStart !== -1 ? html.slice(anchorStart, idx + url.length + 2) : '';
    if (anchor && !/rel=["'][^"']*nofollow/i.test(anchor)) { missingNofollow++; if (noFollowSamples.length < 5) noFollowSamples.push(`${rel}: ${url}`); }
  }
}

const unique = [...new Set(occ)].sort();
const asins = [...new Set(occ.map(u => (u.match(/\/dp\/([A-Z0-9]{10})/) || [])[1]).filter(Boolean))].sort();
fs.writeFileSync(OUT, unique.join('\n') + '\n', 'utf8');

console.log(`Affiliate occurrences : ${occ.length}`);
console.log(`Unique affiliate URLs : ${unique.length}`);
console.log(`Unique ASINs          : ${asins.length}`);
console.log(`Tag values            : ${JSON.stringify(tags)}`);
console.log(`Links missing ?tag=   : ${missingTag}${missingTag ? ' ⚠' : ''}`);
if (noTagSamples.length) console.log('  ' + noTagSamples.join('\n  '));
console.log(`Links missing nofollow: ${missingNofollow}${missingNofollow ? ' ⚠' : ''}`);
if (noFollowSamples.length) console.log('  ' + noFollowSamples.join('\n  '));
console.log(`Manifest written      : ${path.relative(ROOT, OUT)}`);

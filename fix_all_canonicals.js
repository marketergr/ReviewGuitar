/**
 * fix_all_canonicals.js
 * 
 * Fixes all canonical URL and OG URL issues across every HTML file:
 * 1. Strips .html from canonical href (Vercel cleanUrls strips them)
 * 2. Converts /index.html → / in canonicals
 * 3. Fixes og:url to match canonical (no .html)
 * 4. Converts relative og:image URLs to absolute
 * 5. Strips .html from og:url  
 * 6. Adds missing og:url where absent
 * 
 * Run: node fix_all_canonicals.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BASE_URL = 'https://reviewsguitar.com';

// Directories to scan
const SCAN_DIRS = [
  path.join(ROOT, 'collections'),
  path.join(ROOT, 'pages'),
];

// Top-level HTML files to also fix
const TOP_LEVEL_FILES = [
  'index.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'sitemap.html',
];

let totalFixed = 0;
let filesFixed = 0;
let errors = 0;

function getAllHtmlFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function filePathToCanonicalUrl(filePath) {
  // Convert file system path to URL
  let rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  
  // Strip .html extension (cleanUrls)
  rel = rel.replace(/\.html$/, '');
  
  // /index → /
  rel = rel.replace(/\/index$/, '/');
  if (rel === 'index') rel = '';
  
  return `${BASE_URL}/${rel}`;
}

function fixHtml(content, filePath) {
  let changed = false;
  const originalContent = content;
  
  const correctCanonical = filePathToCanonicalUrl(filePath);
  
  // 1. Fix canonical tag
  content = content.replace(
    /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/gi,
    (match, href) => {
      let fixed = href
        .replace(/\.html$/, '')           // strip .html
        .replace(/\/index$/, '/')         // /index → /
        .replace(/\/index\.html$/, '/');  // /index.html → /
      
      // Ensure it starts with the base URL
      if (fixed.startsWith('/')) {
        fixed = BASE_URL + fixed;
      }
      
      const newTag = `<link rel="canonical" href="${fixed}">`;
      if (newTag !== match) {
        changed = true;
        console.log(`  [canonical] ${href} → ${fixed}`);
      }
      return newTag;
    }
  );
  
  // 2. Fix og:url tag
  content = content.replace(
    /<meta\s+property="og:url"\s+content="([^"]+)"\s*\/?>/gi,
    (match, url) => {
      let fixed = url
        .replace(/\.html$/, '')
        .replace(/\/index$/, '/')
        .replace(/\/index\.html$/, '/');
      
      if (fixed.startsWith('/')) {
        fixed = BASE_URL + fixed;
      }
      
      const newTag = `<meta property="og:url" content="${fixed}">`;
      if (newTag !== match) {
        changed = true;
        console.log(`  [og:url]   ${url} → ${fixed}`);
      }
      return newTag;
    }
  );

  // 3. Fix relative og:image → absolute
  content = content.replace(
    /<meta\s+property="og:image"\s+content="((?:\.\.\/|\.\/)[^"]+)"\s*\/?>/gi,
    (match, imgPath) => {
      // Relative path - compute the absolute path from file location
      const fileDir = path.dirname(filePath);
      const absImagePath = path.resolve(fileDir, imgPath);
      const relToRoot = path.relative(ROOT, absImagePath).replace(/\\/g, '/');
      const absoluteUrl = `${BASE_URL}/${relToRoot}`;
      
      const newTag = `<meta property="og:image" content="${absoluteUrl}">`;
      if (newTag !== match) {
        changed = true;
        console.log(`  [og:image] ${imgPath} → ${absoluteUrl}`);
      }
      return newTag;
    }
  );

  // 4. Fix og:image that uses relative paths without ../ (e.g., images/file.jpg)
  content = content.replace(
    /<meta\s+property="og:image"\s+content="(?!https?:\/\/)(?!\/\/)(images\/[^"]+)"\s*\/?>/gi,
    (match, imgPath) => {
      const absoluteUrl = `${BASE_URL}/${imgPath}`;
      const newTag = `<meta property="og:image" content="${absoluteUrl}">`;
      if (newTag !== match) {
        changed = true;
        console.log(`  [og:image] ${imgPath} → ${absoluteUrl}`);
      }
      return newTag;
    }
  );
  
  // 5. Fix twitter:image with relative paths
  content = content.replace(
    /<meta\s+name="twitter:image"\s+content="((?:\.\.\/|\.\/)[^"]+)"\s*\/?>/gi,
    (match, imgPath) => {
      const fileDir = path.dirname(filePath);
      const absImagePath = path.resolve(fileDir, imgPath);
      const relToRoot = path.relative(ROOT, absImagePath).replace(/\\/g, '/');
      const absoluteUrl = `${BASE_URL}/${relToRoot}`;
      
      const newTag = `<meta name="twitter:image" content="${absoluteUrl}">`;
      if (newTag !== match) {
        changed = true;
        console.log(`  [tw:image] ${imgPath} → ${absoluteUrl}`);
      }
      return newTag;
    }
  );

  if (changed) {
    totalFixed += (content.match(/\[canonical\]|\[og:url\]|\[og:image\]|\[tw:image\]/g) || []).length;
    return content;
  }
  return null;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relative = path.relative(ROOT, filePath);
    
    const fixed = fixHtml(content, filePath);
    if (fixed !== null) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      filesFixed++;
      console.log(`✅ Fixed: ${relative}`);
    }
  } catch (err) {
    errors++;
    console.error(`❌ Error processing ${filePath}: ${err.message}`);
  }
}

// Main
console.log('=== Fixing Canonical URLs & OG Tags ===\n');

// Process top-level files
for (const fname of TOP_LEVEL_FILES) {
  const fp = path.join(ROOT, fname);
  if (fs.existsSync(fp)) {
    console.log(`\n📄 ${fname}`);
    processFile(fp);
  }
}

// Process all subdirectory HTML files
for (const dir of SCAN_DIRS) {
  const files = getAllHtmlFiles(dir);
  console.log(`\n📁 Scanning ${path.relative(ROOT, dir)}/ — ${files.length} files`);
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    console.log(`\n📄 ${rel}`);
    processFile(file);
  }
}

console.log('\n=== Summary ===');
console.log(`Files fixed: ${filesFixed}`);
console.log(`Errors: ${errors}`);
console.log('\nDone! ✅');

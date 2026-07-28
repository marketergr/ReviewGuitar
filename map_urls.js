const fs = require('fs');
const path = require('path');

// Load CSV
const csv = fs.readFileSync('bofu_keywords.csv', 'utf8');
const lines = csv.split('\n').filter(l => l.trim().length > 0).slice(1);

// Scan files recursively
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList);
    } else if (name.endsWith('.html')) {
      fileList.push(name.replace(/\\/g, '/'));
    }
  });
  return fileList;
}

const actualFiles = getFiles('pages').concat(getFiles('collections'));

const rewrites = [];

lines.forEach(line => {
  const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
  if (!columns || columns.length < 2) return;
  
  const source = columns[1].replace(/"/g, '');
  const slug = source.split('/').pop().toLowerCase();
  const normalizedSlug = slug.replace(/-/g, '_');
  
  let match = actualFiles.find(f => f.toLowerCase().includes(normalizedSlug));
  
  if (!match) {
    const fragments = slug.split('-');
    const keyword = columns[0].replace(/"/g, '').toLowerCase();
    const keywordTokens = keyword.split(/\s+/).filter(t => t.length > 2);
    
    const matches = actualFiles.filter(f => fragments.every(frag => f.toLowerCase().includes(frag.toLowerCase())));
    if (matches.length > 0) {
      matches.sort((a, b) => {
        let aScore = 0;
        let bScore = 0;
        keywordTokens.forEach(t => {
          if (a.toLowerCase().includes(t)) aScore += (a.toLowerCase().split(t).length - 1);
          if (b.toLowerCase().includes(t)) bScore += (b.toLowerCase().split(t).length - 1);
        });
        return bScore - aScore;
      });
      match = matches[0];
    }
  }
  
  if (!match) {
      if (source.includes('/acoustic/')) match = actualFiles.find(f => f.includes('acoustic_beginner_top_rated'));
      else if (source.includes('/electric/')) match = actualFiles.find(f => f.includes('electric_beginner_top_rated'));
      else match = actualFiles.find(f => f.includes('buying_guides_guitar_buying_guide'));
  }

  if (match) {
    // Standard Vercel Rewrite: source -> destination
    // Note: Leading slash is mandatory for both
    rewrites.push({
      source: source,
      destination: `/${match}`
    });
  }
});

// Robust Vercel Config
const vercelConfigPath = 'vercel.json';
let existingConfig = {};
try {
  existingConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
} catch (e) {
  console.log('Error reading existing vercel.json:', e.message);
}

const vercelConfig = {
  "cleanUrls": existingConfig.cleanUrls !== undefined ? existingConfig.cleanUrls : true,
  "redirects": existingConfig.redirects || [],
  "rewrites": rewrites
};

fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
console.log(`Final Vercel Routing Map: ${rewrites.length} entries generated.`);

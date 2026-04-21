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
    match = actualFiles.find(f => fragments.every(frag => f.toLowerCase().includes(frag.toLowerCase())));
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
const vercelConfig = {
  // Removing cleanUrls to prevent interference with manual rewrites
  "rewrites": rewrites
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log(`Final Vercel Routing Map: ${rewrites.length} entries generated.`);

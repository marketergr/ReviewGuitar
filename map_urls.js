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
const updatedCsvLines = ["keyword,landing_page_url,page_type,pinterest_hook,tiktok_hook"];

lines.forEach(line => {
  // Robust CSV splitting for quoted values
  const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
  if (!columns || columns.length < 5) {
      updatedCsvLines.push(line);
      return;
  }
  
  const keyword = columns[0].replace(/"/g, '');
  const source = columns[1].replace(/"/g, '');
  const pageType = columns[2].replace(/"/g, '');
  
  // Find a matching file
  const slug = source.split('/').pop().toLowerCase();
  const normalizedSlug = slug.replace(/-/g, '_');
  
  // Priority 1: Exact slug match
  let match = actualFiles.find(f => f.toLowerCase().includes(normalizedSlug));
  
  // Priority 2: Keyword fragments
  if (!match) {
    const fragments = slug.split('-');
    match = actualFiles.find(f => fragments.every(frag => f.toLowerCase().includes(frag.toLowerCase())));
  }
  
  // Priority 3: Silo fallback
  if (!match) {
      if (source.includes('/acoustic/')) match = actualFiles.find(f => f.includes('acoustic_beginner_top_rated'));
      else if (source.includes('/electric/')) match = actualFiles.find(f => f.includes('electric_beginner_top_rated'));
      else match = actualFiles.find(f => f.includes('buying_guides_guitar_buying_guide'));
  }

  if (match) {
    rewrites.push({
      source: source,
      destination: `/${match}`
    });
    // Ensure CSV uses the clean SEO URL
    updatedCsvLines.push(`"${keyword}","${source}","${pageType}","${columns[3].replace(/"/g, '')}","${columns[4].replace(/"/g, '')}"`);
  } else {
    updatedCsvLines.push(line);
  }
});

const vercelConfig = {
  cleanUrls: true,
  trailingSlash: false,
  rewrites: rewrites
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
fs.writeFileSync('bofu_keywords.csv', updatedCsvLines.join('\n'));

console.log(`Successfully mapped ${rewrites.length} URLs to vercel.json and updated CSV.`);

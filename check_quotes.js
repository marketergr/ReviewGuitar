const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.html')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('.');
let foundBrokenQuotes = false;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(/href=[^"']/)) {
    console.log('Broken quotes found in', file);
    foundBrokenQuotes = true;
  }
}
if(!foundBrokenQuotes) console.log('No broken quotes found.');

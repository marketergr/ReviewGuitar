const fs = require('fs');
const p = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const replacements = JSON.parse(fs.readFileSync('asin_replacements.json', 'utf8'));
const deadAsins = Object.keys(replacements).filter(k => replacements[k].newAsin === null);
const cleanP = p.filter(item => {
    const hasDead = deadAsins.some(asin => item.amazonLink && item.amazonLink.includes(asin));
    return !hasDead;
});
fs.writeFileSync('products.json', JSON.stringify(cleanP, null, 2));
console.log('Removed ' + (p.length - cleanP.length) + ' dead products.');

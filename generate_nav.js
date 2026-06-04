const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));
let navHTML = '<ul>\n';
structure.siloConfigs.forEach(silo => {
  navHTML += '    <li><a href="/collections/' + silo.name + '">' + silo.displayName + '</a></li>\n';
  silo.pages.forEach(page => {
    navHTML += '    <li><a href="/collections/' + silo.name + '/' + page.slug + '">' + page.title + '</a></li>\n';
  });
});
navHTML += '  </ul>\n';
fs.writeFileSync('navigation.html', navHTML);
console.log('Generated navigation.html with ' + structure.siloConfigs.reduce((sum, s) => sum + 1 + s.pages.length, 0) + ' navigation items');
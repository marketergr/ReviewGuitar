const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('site-structure.json', 'utf8'));
let pageCount = 0;

structure.siloConfigs.forEach(function(silo) {
  // Create silo index page
  var siloContent = '    <div class="silo-card">\n        <h3>' + silo.displayName + '</h3>\n        <p>Comprehensive guides and reviews for ' + silo.name + ' guitars</p>\n        <a href="' + silo.name + '/index.html">Explore ' + silo.displayName + ' →</a>\n    </div>';
  
  var siloHTML = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta name="description" content="' + silo.displayName + ' reviews and buying guides. Find the best ' + silo.name + ' guitars, accessories, and lessons.">\n    <meta name="keywords" content="' + silo.name + ' guitar, ' + silo.name + ' review, best ' + silo.name + ' 2026">\n    <title>' + silo.displayName + ' - GuitarReview.com</title>\n    <link rel="stylesheet" href="../css/style.css">\n</head>\n<body>\n    <header>\n        <h1>GuitarReview.com</h1>\n        <nav><a href="../index.html">Home</a> > ' + silo.displayName + '</nav>\n    </header>\n    <main>\n        <h2>' + silo.displayName + '</h2>\n        ' + siloContent + '\n        <div class="silo-grid">\n' + silo.pages.map(function(p) {
    return '            <div class="silo-card">\n                <h3>' + p.title + '</h3>\n                <p>' + p.keywords + '</p>\n                <a href="' + p.slug + '.html">Read Guide →</a>\n            </div>';
}).join('\n            ') + '\n        </div>\n    </main>\n    <footer>\n        <p>&copy; 2026 GuitarReview.com. Affiliate disclosure applies.</p>\n    </footer>\n</body>\n</html>';
  
  var dir = 'silos/' + silo.name;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(dir + '/index.html', siloHTML);
  pageCount++;
  
  // Create cluster pages
  silo.pages.forEach(function(page) {
    var keywordsStr = Array.isArray(page.keywords) ? page.keywords.join(', ') : page.keywords;
    var clusterHTML = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <meta name="description" content="' + page.title + '. Learn about ' + page.title.toLowerCase() + ' and find the best options for your needs.">\n    <meta name="keywords" content="' + keywordsStr + '">\n    <title>' + page.title + ' - GuitarReview.com</title>\n    <link rel="stylesheet" href="../../css/style.css">\n</head>\n<body>\n    <header>\n        <h1>GuitarReview.com</h1>\n        <nav>\n            <a href="../../index.html">Home</a> > \n            <a href="../' + silo.name + '/index.html">' + silo.displayName + '</a> > \n            ' + page.title + '\n        </nav>\n    </header>\n    <main>\n        <h2>' + page.title + '</h2>\n        <article>\n            <p>This comprehensive guide covers everything you need to know about <strong>' + page.title + '</strong>. Whether you\'re a beginner or an experienced player, our expert reviews and recommendations will help you make the right choice.</p>\n            <p>Key topics include: product comparisons, pricing analysis, features breakdown, and user feedback.</p>\n            <div class="silo-grid">\n                <div class="silo-card">\n                    <h3>Best Options</h3>\n                    <ul>' + keywordsStr.split(',').map(function(k) { return '<li>' + k.trim() + '</li>'; }).join('') + '</ul>\n                </div>\n                <div class="silo-card">\n                    <h3>Related Products</h3>\n                    <ul>\n                        <li>Product comparison charts</li>\n                        <li>Price tracking and deals</li>\n                        <li>User reviews and ratings</li>\n                    </ul>\n                </div>\n            </div>\n        </article>\n        <aside class="related">\n            <h3>Related Articles</h3>\n            <ul>\n                <li><a href="../' + silo.name + '/index.html">← Back to ' + silo.displayName + '</a></li>\n                <li><a href="../../silos/' + (silo.name === 'acoustic' ? 'electric' : 'acoustic') + '/index.html">Explore other categories</a></li>\n            </ul>\n        </aside>\n    </main>\n    <footer>\n        <p>&copy; 2026 GuitarReview.com. Affiliate disclosure applies.</p>\n    </footer>\n</body>\n</html>';
    
    fs.writeFileSync(dir + '/' + page.slug + '.html', clusterHTML);
    pageCount++;
  });
});

console.log('Generated', pageCount, 'pages across', structure.siloConfigs.length, 'silos');

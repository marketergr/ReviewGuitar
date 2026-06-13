const fs = require('fs');
const path = require('path');

function getAllHtmlFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        arrayOfFiles = getAllHtmlFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.html')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const htmlFiles = getAllHtmlFiles(__dirname);
let replacedCount = 0;

const uniformFooter = `<footer class="footer-hub">
        <div class="footer-content">
            <div class="footer-brand">
                <h2>REVIEWSGUITAR.COM</h2>
                <p>Establishing the elite standard for musical gear analysis in 2026. We test, we play, we review—so you can find your perfect sound without the noise.</p>
            </div>
            <div class="footer-column">
                <h3>Collections</h3>
                <ul class="footer-links">
                    <li><a href="/collections/acoustic">Acoustic Guitars</a></li>
                    <li><a href="/collections/electric">Electric Guitars</a></li>
                    <li><a href="/collections/accessories">Essential Gear</a></li>
                    <li><a href="/collections/learning">Education</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3>Guides</h3>
                <ul class="footer-links">
                    <li><a href="/collections/buying">Buying Guides</a></li>
                    <li><a href="/guides/recording/best-way-to-distribute-your-guitar-music-in-2026">Distribution Guide</a></li>
                    <li><a href="/best/premium-acoustic-guitars-under-3000">Premium Acoustics</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3>Legal</h3>
                <ul class="footer-links">
                    <li><a href="/about">About Us</a></li>
                    <li><a href="/privacy">Privacy Policy</a></li>
                    <li><a href="/terms">Terms & Conditions</a></li>
                    <li><a href="/contact">Contact Us</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 ReviewsGuitar.com. All Rights Reserved. Built for the modern musician.</p>
        </div>
    </footer>`;

for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const footerRegex = /<footer class="footer-hub">[\s\S]*?<\/footer>/;
    
    if (footerRegex.test(content)) {
        content = content.replace(footerRegex, uniformFooter);
        
        // Also fix the word "Silo" if it's used elsewhere for users
        content = content.replace(/Learning Silo/g, 'Learning Hub');
        
        fs.writeFileSync(file, content, 'utf8');
        replacedCount++;
    }
}

console.log('Fixed footers in ' + replacedCount + ' files.');

// Now add the link to the guides page
const buyingIndex = path.join(__dirname, 'collections/buying/index.html');
let buyingContent = fs.readFileSync(buyingIndex, 'utf8');
const newGuideHtml = `
            <div class="silo-card" style="min-height: 200px; background: var(--surface); justify-content: flex-start; padding: 2rem;">
                <h3 style="font-size: 1.2rem; margin-bottom: 1rem;">Music Distribution 2026</h3>
                <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">How to get your guitar tracks on Spotify and Apple Music using DistroKid and TuneCore.</p>
                <a href="/guides/recording/best-way-to-distribute-your-guitar-music-in-2026" style="color: var(--primary); font-size: 0.8rem;">READ GUIDE →</a>
            </div>
        `;
if (!buyingContent.includes('best-way-to-distribute-your-guitar-music-in-2026')) {
    buyingContent = buyingContent.replace('<div class="featured-silos" style="padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1rem;">', 
        '<div class="featured-silos" style="padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1rem;">\n' + newGuideHtml);
    fs.writeFileSync(buyingIndex, buyingContent, 'utf8');
    console.log('Added guide to collections/buying/index.html');
}

// Check index.html for missing images
const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const missingImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
let match;
while (match = missingImgRegex.exec(indexContent)) {
    const src = match[1];
    if (src && src.trim() !== '') {
        // verify if the src points to an empty or non-existent local image
        if (!src.startsWith('http') && !src.startsWith('data:')) {
            const localPath = path.join(__dirname, src.startsWith('/') ? src.substring(1) : src);
            if (!fs.existsSync(localPath)) {
                console.log('Missing image found in index.html:', src);
            }
        }
    } else {
        console.log('Empty image src found in index.html');
    }
}

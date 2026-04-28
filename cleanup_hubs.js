const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

function cleanupFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern for the old "ReviewsGuitar.com" link block
    // It's a div with a specific style and an h3 with "Deep Dives" or similar, 
    // and links that contain "ReviewsGuitar.com" as text.
    
    const oldBlockRegex = /<div style="background: var\(--glass\); padding: 2rem; border-radius: var\(--radius\); border: 1px solid var\(--border\); margin-top: 3rem;">\s*<h3[^>]*>.*?<\/h3>\s*<ul[^>]*>[\s\S]*?ReviewsGuitar\.com[\s\S]*?<\/ul>\s*<\/div>/g;
    
    if (oldBlockRegex.test(content)) {
        content = content.replace(oldBlockRegex, '');
        fs.writeFileSync(filePath, content);
        console.log(`Cleaned up old link blocks in ${filePath}`);
    }
}

const filesToClean = [
    'index.html',
    'collections/acoustic/index.html',
    'collections/electric/index.html',
    'collections/accessories/index.html',
    'collections/learning/index.html',
    'collections/buying/index.html'
];

filesToClean.forEach(f => {
    const fullPath = path.join(rootDir, f);
    if (fs.existsSync(fullPath)) {
        cleanupFile(fullPath);
    }
});

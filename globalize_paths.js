const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            if (f !== 'node_modules' && f !== '.git') walk(fullPath, callback);
        } else if (f.endsWith('.html')) {
            callback(fullPath);
        }
    });
}

walk(rootDir, filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Convert relative links starting with ../ or collections/ or pages/ or css/ or images/
    // We look for href=".." or href="collections" or href="pages"
    
    // Pattern 1: Relative ../../ or ../
    const relativePattern = /href=["'](?:\.\.\/)+([^"']+)["']/g;
    content = content.replace(relativePattern, (match, p1) => {
        changed = true;
        return `href="/${p1}"`;
    });

    // Pattern 2: Naked relative (e.g. collections/acoustic/index)
    // Only if it doesn't start with / or http or # or mailto or ..
    const nakedPattern = /href=["'](collections\/|pages\/|css\/|images\/|index|about|privacy|terms)([^"']*)["']/g;
    content = content.replace(nakedPattern, (match, p1, p2) => {
        if (match.includes('://')) return match;
        changed = true;
        return `href="/${p1}${p2}"`;
    });
    
    // Pattern 3: src relative
    const srcRelativePattern = /src=["'](?:\.\.\/)+([^"']+)["']/g;
    content = content.replace(srcRelativePattern, (match, p1) => {
        changed = true;
        return `src="/${p1}"`;
    });
    
    const srcNakedPattern = /src=["'](images\/|css\/|js\/)([^"']*)["']/g;
    content = content.replace(srcNakedPattern, (match, p1, p2) => {
        if (match.includes('://')) return match;
        changed = true;
        return `src="/${p1}${p2}"`;
    });

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Globalized paths in: ${path.relative(rootDir, filePath)}`);
    }
});

console.log('Finished globalizing paths.');

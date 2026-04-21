const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'css', 'style.css');
const minPath = path.join(__dirname, 'css', 'style.min.css');

if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const minified = css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ')             // Collapse whitespace
        .replace(/\s*([{};:])\s*/g, '$1') // Remove space around symbols
        .replace(/;}/g, '}')             // Remove last semicolon
        .trim();
    
    fs.writeFileSync(minPath, minified);
    console.log('CSS Minified successfully to style.min.css');
} else {
    console.error('style.css not found');
}

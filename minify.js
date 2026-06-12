const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'css', 'style.css');
const cssMinPath = path.join(__dirname, 'css', 'style.min.css');

if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const minifiedCss = css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ')             // Collapse whitespace
        .replace(/\s*([{};:])\s*/g, '$1') // Remove space around symbols
        .replace(/;}/g, '}')             // Remove last semicolon
        .trim();
    
    fs.writeFileSync(cssMinPath, minifiedCss);
    console.log('CSS Minified successfully to style.min.css');
} else {
    console.error('style.css not found');
}

const jsPath = path.join(__dirname, 'js', 'nav.js');
const jsMinPath = path.join(__dirname, 'js', 'nav.min.js');

if (fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, 'utf8');
    const minifiedJs = js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\/\/.*/g, '')           // Remove single-line comments
        .replace(/\s+/g, ' ')             // Collapse whitespace
        .replace(/\s*([=+\-*/{}[\];(),<>!&|])\s*/g, '$1') // Remove space around symbols
        .trim();
    
    fs.writeFileSync(jsMinPath, minifiedJs);
    console.log('JS Minified successfully to nav.min.js');
} else {
    console.error('nav.js not found');
}

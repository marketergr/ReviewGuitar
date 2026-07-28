const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
let match;
while (match = regex.exec(html)) {
    console.log(match[1]);
}

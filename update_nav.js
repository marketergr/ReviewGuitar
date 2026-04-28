const fs = require('fs');
const path = require('path');

const NEW_NAV = `<nav>
        <div class="mobile-menu-toggle">☰ Menu</div>
        <ul class="nav-links">
            <li><a href="/index.html">Home</a></li>
            <li class="dropdown">
                <a href="/collections/acoustic/index.html">Acoustic</a>
                <div class="dropdown-content">
                    <a href="/collections/acoustic/best-for-beginners.html">Best for Beginners</a>
                    <a href="/collections/acoustic/best-under-500.html">Best Under $500</a>
                    <a href="/collections/acoustic/premium-guide.html">Premium Guide</a>
                </div>
            </li>
            <li class="dropdown">
                <a href="/collections/electric/index.html">Electric</a>
                <div class="dropdown-content">
                    <a href="/collections/electric/starters.html">Starter Kits</a>
                    <a href="/collections/electric/metal-guitars.html">Best for Metal</a>
                    <a href="/collections/electric/best-under-300.html">Best Under $300</a>
                </div>
            </li>
            <li class="dropdown">
                <a href="/collections/accessories/index.html">Gear</a>
                <div class="dropdown-content">
                    <a href="/collections/accessories/strings.html">Strings</a>
                    <a href="/collections/accessories/pedals.html">Pedals</a>
                    <a href="/collections/accessories/amps.html">Amps</a>
                </div>
            </li>
            <li class="dropdown">
                <a href="/collections/learning/index.html">Education</a>
                <div class="dropdown-content">
                    <a href="/collections/learning/apps.html">Learning Apps</a>
                    <a href="/collections/learning/courses.html">Video Courses</a>
                    <a href="/collections/learning/tips.html">Guitar Tips</a>
                </div>
            </li>
            <li><a href="/collections/buying/index.html">Guides</a></li>
        </ul>
    </nav>`;

const NEW_FOOTER = `<footer class="footer-hub">
        <div class="footer-content">
            <div class="footer-brand">
                <h2>REVIEWSGUITAR.COM</h2>
                <p>Establishing the elite standard for musical gear analysis in 2026. We test, we play, we review—so you can find your perfect sound without the noise.</p>
            </div>
            <div class="footer-column">
                <h3>Collections</h3>
                <ul class="footer-links">
                    <li><a href="/collections/acoustic/index.html">Acoustic Guitars</a></li>
                    <li><a href="/collections/electric/index.html">Electric Guitars</a></li>
                    <li><a href="/collections/accessories/index.html">Essential Gear</a></li>
                    <li><a href="/collections/learning/index.html">Education</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3>Guides</h3>
                <ul class="footer-links">
                    <li><a href="/collections/acoustic/beginner-guide.html">Beginner Start</a></li>
                    <li><a href="/collections/electric/prs-se-mark-holcomb-signature-electric-guitar-in-holcomb-burst.html">Metal Guide</a></li>
                    <li><a href="/collections/buying/index.html">Buying Strategy</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3>Legal</h3>
                <ul class="footer-links">
                    <li><a href="/about.html">About Us</a></li>
                    <li><a href="/privacy.html">Privacy Policy</a></li>
                    <li><a href="/terms.html">Terms & Conditions</a></li>
                    <li><a href="/contact.html">Contact Us</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 ReviewsGuitar.com. All Rights Reserved. Built for the modern musician.</p>
        </div>
    </footer>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
            const navLinks = document.querySelector('.nav-links');
            
            if(mobileMenuToggle && navLinks) {
                mobileMenuToggle.addEventListener('click', () => {
                    navLinks.classList.toggle('active');
                });
            }
        });
    </script>
</body>`;

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'css' && file !== 'images' && file !== '.git' && file !== 'GSC') {
                processDir(fullPath);
            }
        } else if (file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replace <nav>...</nav>
            const navRegex = /<nav>[\s\S]*?<\/nav>/i;
            if (navRegex.test(content)) {
                content = content.replace(navRegex, NEW_NAV);
            }
            
            // Replace <footer class="footer-hub">...</footer>
            const footerRegex = /<footer class="footer-hub">[\s\S]*?<\/body>/i;
            if (footerRegex.test(content)) {
                content = content.replace(footerRegex, NEW_FOOTER);
            }

            // Also check for <link rel="stylesheet" href="...style.min.css">
            const styleRegex = /<link rel="stylesheet" href="[^"]*style\.min\.css">/i;
            if (styleRegex.test(content)) {
                content = content.replace(styleRegex, '<link rel="stylesheet" href="/css/style.min.css">');
            }
            
            fs.writeFileSync(fullPath, content);
            console.log('Updated', fullPath);
        }
    }
}

processDir(process.cwd());

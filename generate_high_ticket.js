const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'templates', 'page-template.html');
const template = fs.readFileSync(templatePath, 'utf8');

const pagesDir = path.join(__dirname, 'pages');

const articles = [
  {
    filename: 'bofu_best_premium-acoustic-guitars-under-3000.html',
    title: 'Top Premium Acoustic Guitars Under $3000 (2026)',
    mainTitle: 'The Best Premium Acoustic Guitars Under $3000',
    description: 'A professional guide to the best premium acoustic guitars under $3000, featuring Martin, Taylor, and Gibson. Stop buying budget guitars and invest in a lifetime instrument.',
    keywords: 'premium acoustic guitars, best acoustic guitar under 3000, martin d-28, taylor 814ce, high-end acoustic guitars',
    content: `
        <div style="text-align: center; margin-bottom: 3rem;">
            <img src="https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=80" alt="Premium Acoustic Guitars" style="width: 100%; border-radius: 12px;">
        </div>
        <p style="font-size: 1.2rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">When you cross the $2,000 threshold, you're no longer buying a tool—you're investing in an heirloom. Premium acoustic guitars under $3000 offer unmatched tonal complexity, flawless fretwork, and solid tonewoods that actually sound better as they age.</p>
        <p style="font-size: 1.2rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 4rem;">For instruments at this level, we strongly recommend buying from a dedicated retailer like <strong>Sweetwater</strong>, where every guitar undergoes a 55-point inspection before shipping, rather than risking it with a mass-market retailer.</p>

        <div style="background: var(--glass); padding: 3rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 4rem;">
            <h3 style="color: var(--primary); font-size: 2rem; margin-bottom: 1rem;">1. Martin D-28 Standard</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 1.5rem;">The quintessential acoustic guitar. The D-28 has been the gold standard for dreadnoughts for nearly a century. With East Indian Rosewood back and sides paired with a Sitka Spruce top, it delivers a booming bass and crystal-clear highs.</p>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <a href="https://www.sweetwater.com/" class="btn" style="flex: 1; text-align: center;" target="_blank" rel="noopener nofollow">Check Price on Sweetwater</a>
                <a href="https://reverb.com/" class="btn" style="flex: 1; background: #FF5A00; color: white; border: none; text-align: center;" target="_blank" rel="noopener nofollow">Find Used on Reverb</a>
            </div>
        </div>

        <div style="background: var(--glass); padding: 3rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 4rem;">
            <h3 style="color: var(--primary); font-size: 2rem; margin-bottom: 1rem;">2. Taylor 814ce</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 1.5rem;">If the D-28 is a muscle car, the 814ce is a modern sports car. Taylor's flagship Grand Auditorium features the revolutionary V-Class bracing, offering unmatched intonation across the entire neck. The onboard ES2 electronics make it gig-ready out of the box.</p>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <a href="https://www.sweetwater.com/" class="btn" style="flex: 1; text-align: center;" target="_blank" rel="noopener nofollow">Check Price on Sweetwater</a>
                <a href="https://reverb.com/" class="btn" style="flex: 1; background: #FF5A00; color: white; border: none; text-align: center;" target="_blank" rel="noopener nofollow">Find Used on Reverb</a>
            </div>
        </div>
    `
  },
  {
    filename: 'bofu_best_boutique-electric-guitars-for-recording.html',
    title: 'Best Boutique Electric Guitars for Recording (2026)',
    mainTitle: 'Top Boutique Electric Guitars for the Studio',
    description: 'Find the absolute best boutique electric guitars for recording in 2026. Perfect for studio musicians looking for zero-hum performance and endless sustain.',
    keywords: 'boutique electric guitars, studio electric guitars, recording guitar, high-end electric guitar, suhr, prs core',
    content: `
        <div style="text-align: center; margin-bottom: 3rem;">
            <img src="https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=1200&q=80" alt="Boutique Electric Guitars" style="width: 100%; border-radius: 12px;">
        </div>
        <p style="font-size: 1.2rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">In the recording studio, the margin for error is zero. You can't afford noisy pickups, poor fret leveling, or tuning instability. Boutique electric guitars are engineered for absolute perfection.</p>
        <p style="font-size: 1.2rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 4rem;">Because these are serious investments, we recommend <strong>zZounds</strong> for their flexible "Play as you Pay" installment plans, allowing you to finance a $3,000 instrument without a credit check.</p>

        <div style="background: var(--glass); padding: 3rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 4rem;">
            <h3 style="color: var(--primary); font-size: 2rem; margin-bottom: 1rem;">1. PRS Custom 24 (Core Series)</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 1.5rem;">The PRS Custom 24 is the ultimate studio chameleon. The 85/15 pickups offer five distinct sounds, allowing you to go from thick humbucker roars to crystal-clear single-coil spank with a flick of a switch.</p>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <a href="https://www.zzounds.com/" class="btn" style="flex: 1; text-align: center;" target="_blank" rel="noopener nofollow">Finance on zZounds</a>
                <a href="https://www.sweetwater.com/" class="btn" style="flex: 1; background: #0076CE; color: white; border: none; text-align: center;" target="_blank" rel="noopener nofollow">Check Sweetwater</a>
            </div>
        </div>
    `
  },
  {
    filename: 'bofu_best_vintage-guitars-investment-guide.html',
    title: 'The 2026 Vintage Guitar Investment Guide',
    mainTitle: 'Investing in Vintage Guitars: What to Buy in 2026',
    description: 'Learn which vintage guitars are actually worth buying as an investment in 2026. A complete guide to navigating Reverb for the best deals.',
    keywords: 'vintage guitars, guitar investment, buying vintage guitars on reverb, pre-cbs stratocaster, vintage gibson',
    content: `
        <div style="text-align: center; margin-bottom: 3rem;">
            <img src="https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?auto=format&fit=crop&w=1200&q=80" alt="Vintage Guitars" style="width: 100%; border-radius: 12px;">
        </div>
        <p style="font-size: 1.2rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 2rem;">Vintage guitars have consistently outperformed the stock market over the last two decades. But in 2026, the landscape has changed. Pre-CBS Fenders and '59 Les Pauls are essentially museum pieces, so where should the smart money go?</p>
        <p style="font-size: 1.2rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 4rem;"><strong>Reverb.com</strong> is the undisputed king of the vintage market. It offers buyer protection and a global inventory that local pawn shops simply cannot match.</p>

        <div style="background: var(--glass); padding: 3rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 4rem;">
            <h3 style="color: var(--primary); font-size: 2rem; margin-bottom: 1rem;">The "Player Grade" 70s Fenders</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 1.5rem;">While 60s Fenders are astronomically priced, the mid-to-late 70s models are seeing a massive resurgence in value. Look for hardtail Stratocasters and Telecaster Customs with original Wide-Range Humbuckers.</p>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <a href="https://reverb.com/" class="btn" style="flex: 1; background: #FF5A00; color: white; border: none; text-align: center;" target="_blank" rel="noopener nofollow">Search 70s Fenders on Reverb</a>
            </div>
        </div>
        
        <div style="background: var(--glass); padding: 3rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 4rem;">
            <h3 style="color: var(--primary); font-size: 2rem; margin-bottom: 1rem;">Early 90s PRS Guitars</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dim); margin-bottom: 1.5rem;">Paul Reed Smith guitars manufactured before 1995 (specifically in the old Annapolis factory) are highly sought after by collectors. They feature smaller heel joints and highly figured tops that are incredibly rare today.</p>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <a href="https://reverb.com/" class="btn" style="flex: 1; background: #FF5A00; color: white; border: none; text-align: center;" target="_blank" rel="noopener nofollow">Search Vintage PRS on Reverb</a>
            </div>
        </div>
    `
  }
];

articles.forEach(article => {
    let result = template
        .replace(/{{title}}/g, article.title + ' | ReviewsGuitar.com')
        .replace(/{{mainTitle}}/g, article.mainTitle)
        .replace(/{{description}}/g, article.description)
        .replace(/{{keywords}}/g, article.keywords)
        .replace(/{{content}}/g, article.content)
        .replace(/{{siteTitle}}/g, 'ReviewsGuitar.com')
        .replace(/{{basePath}}/g, '/')
        .replace(/{{relatedLinks}}/g, `
            <li><a href="/guides/recording/best-way-to-distribute-your-guitar-music-in-2026" style="color: var(--primary); text-decoration: none; font-size: 1.1rem; line-height: 2;">Music Distribution Guide</a></li>
            <li><a href="/best/acoustic-guitar-under-500" style="color: var(--primary); text-decoration: none; font-size: 1.1rem; line-height: 2;">Best Acoustics Under $500</a></li>
            <li><a href="/collections/electric/metal-guitars" style="color: var(--primary); text-decoration: none; font-size: 1.1rem; line-height: 2;">Top Metal Guitars</a></li>
        `);

    const filepath = path.join(pagesDir, article.filename);
    fs.writeFileSync(filepath, result, 'utf8');
    console.log('Created:', article.filename);
});

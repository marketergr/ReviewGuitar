const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'pages');

const ctaHTML = `
        <section style="background: var(--glass); padding: 4rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 4rem;">
            <h2 style="font-size: 2rem; margin-bottom: 1.5rem; text-align: center;">Expert Tip: Master Your New Guitar</h2>
            <p style="font-size: 1.2rem; color: var(--text-dim); line-height: 1.8; margin-bottom: 2rem; text-align: center;">You've found the perfect beginner guitar. Now it's time to learn how to play it. Skip the confusing YouTube tutorials and learn from the pros with structured, step-by-step video lessons.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div style="background: rgba(0,0,0,0.4); padding: 2rem; border-radius: 8px; border: 1px solid #333;">
                    <h3 style="color: var(--primary); margin-bottom: 1rem;">TrueFire (Best Course Library)</h3>
                    <p style="color: var(--text-dim); margin-bottom: 1.5rem;">Access over 60,000 video lessons from legends like Steve Vai and Tommy Emmanuel. Perfect for structured learning from day one.</p>
                    <a href="https://truefire.com/" class="btn" style="display: block; text-align: center;" target="_blank" rel="noopener nofollow">Start Learning on TrueFire</a>
                </div>
                <div style="background: rgba(0,0,0,0.4); padding: 2rem; border-radius: 8px; border: 1px solid #333;">
                    <h3 style="color: var(--primary); margin-bottom: 1rem;">Fender Play (Best for Apps)</h3>
                    <p style="color: var(--text-dim); margin-bottom: 1.5rem;">Bite-sized, high-quality lessons designed specifically for absolute beginners. Available on desktop and mobile.</p>
                    <a href="https://www.amazon.com/dp/B07L5YYHQC/?tag=reviewsguitar-20" class="btn-amazon" style="display: block; text-align: center;" target="_blank" rel="noopener nofollow">Get Fender Play</a>
                </div>
            </div>
        </section>
`;

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    
    let count = 0;
    files.forEach(function (file) {
        if (file.includes('beginner') && file.endsWith('.html')) {
            const filePath = path.join(directoryPath, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if already injected
            if (!content.includes('Master Your New Guitar')) {
                // Find </main>
                if (content.includes('</main>')) {
                    content = content.replace('</main>', ctaHTML + '\n    </main>');
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log('Injected CTA into', file);
                    count++;
                }
            } else {
                console.log('Already injected in', file);
            }
        }
    });
    console.log(`Finished injecting into ${count} files.`);
});

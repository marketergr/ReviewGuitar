const http = require('http');
const fs = require('fs');

const CACHE_FILE = 'content_cache.json';
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;

// Load current keywords from generate_seo.js (simplified for this script)
const SEO_KEYWORDS = {
    acoustic: {
        beginner: ["best acoustic guitar for beginners 2026", "top rated beginner acoustic guitar", "affordable acoustic guitar starter kit", "buy acoustic guitar beginner bundle"],
        intermediate: ["best intermediate acoustic guitar", "professional acoustic guitar reviews", "top selling acoustic guitars 2026", "acoustic guitar upgrade deals"],
        advanced: ["professional acoustic guitar comparison", "best acoustic guitar for recording", "high end acoustic guitar reviews", "acoustic guitar tonewood guide"],
        professional: ["professional acoustic guitar purchase", "best acoustic guitar brands 2026", "custom acoustic guitar builders", "investment grade acoustic guitars"]
    },
    electric: {
        beginner: ["best electric guitar for beginners 2026", "starter electric guitar kit buy", "affordable electric guitar beginner", "top rated beginner electric guitar"],
        intermediate: ["best intermediate electric guitar", "electric guitar upgrade deals", "professional electric guitar reviews", "top selling electric guitars 2026"],
        advanced: ["professional electric guitar comparison", "best electric guitar for solos", "high end electric guitar reviews", "electric guitar customization guide"],
        professional: ["professional electric guitar purchase", "best electric guitar brands 2026", "custom electric guitar builders", "investment grade electric guitars"]
    },
    accessories: {
        strings: ["best guitar strings 2026", "buy guitar strings bulk", "guitar strings review comparison", "affordable guitar strings deals"],
        picks: ["best guitar picks 2026", "buy guitar picks bulk", "guitar picks review comparison", "top rated guitar picks"],
        cables: ["best guitar cables 2026", "buy instrument cables", "guitar cable review comparison", "affordable guitar cables"],
        stands: ["best guitar stands 2026", "buy guitar stands", "guitar stand review comparison", "top rated guitar stands"],
        cases: ["best guitar cases 2026", "buy guitar cases reviews", "guitar case comparison guide", "affordable guitar hard cases"]
    },
    learning: {
        courses: ["best guitar courses 2026", "buy online guitar lessons", "guitar learning courses review", "top rated guitar courses"],
        books: ["best guitar books 2026", "buy guitar learning books", "guitar method book review", "top guitar books for beginners"],
        videos: ["best guitar video courses", "buy guitar tutorial videos", "guitar lesson video review", "top rated guitar tutorials"],
        apps: ["best guitar learning apps 2026", "buy guitar app subscription", "guitar app review comparison", "top guitar learning apps"]
    },
    buying: {
        guides: ["guitar buying guide 2026", "best guitar buying guide", "how to buy a guitar guide", "guitar purchase guide review"],
        reviews: ["guitar reviews 2026", "best guitar reviews site", "guitar review comparison", "top guitar reviews"],
        comparisons: ["guitar comparison 2026", "best guitar vs comparison", "acoustic vs electric guitar buy", "guitar brands comparison"],
        deals: ["best guitar deals 2026", "guitar sale deals", "affordable guitar deals", "guitar discount offers"]
    }
};

let cache = {};
if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}

async function askOllama(prompt) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: 'gemma2:9b',
            prompt: prompt,
            stream: false
        });

        const options = {
            hostname: OLLAMA_HOST,
            port: OLLAMA_PORT,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve(response.response);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function generateAll() {
    console.log("Starting AI Content Generation...");
    
    for (const [silo, categories] of Object.entries(SEO_KEYWORDS)) {
        for (const [category, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                if (cache[keyword]) {
                    console.log(`Skipping: ${keyword} (already in cache)`);
                    continue;
                }

                console.log(`Generating content for: ${keyword}...`);
                const prompt = `Write a professional, SEO-optimized guitar review/buying guide for the keyword: "${keyword}".
                Tone: Helpful, premium, and expert.
                Structure:
                - Introduction (Why this matters in 2026)
                - Technical Analysis (Fretwork, Tonewoods, Electronics)
                - Professional Verdict
                - 3 FAQ questions and answers
                Limit the response to about 500 words. Format with simple HTML tags (h2, p, ul, li). Do not include head or body tags.`;

                try {
                    const article = await askOllama(prompt);
                    cache[keyword] = article;
                    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
                    console.log(`Success: ${keyword}`);
                } catch (e) {
                    console.error(`Error generating ${keyword}:`, e.message);
                }
            }
        }
    }
    console.log("Content Generation Complete!");
}

generateAll();

/**
 * audit/destuff_content_cache.js  (Phase 1)
 *
 * De-stuffs content_cache.json IN PLACE: removes ALL-CAPS keyword shouting and
 * empty filler, de-keywords the universal FAQ/verdict templates, and replaces
 * remaining body keyword mentions with natural category references. The exact
 * keyword is left to appear only in H1/<title>/meta (generated elsewhere).
 *
 * It does NOT invent prose — it trims and varies. The pages remain generic and
 * are flagged for real first-hand notes (homework) by generate_seo.js.
 *
 * Idempotent. Run: node audit/destuff_content_cache.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '..', 'content_cache.json');

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Natural category noun for body references (keyword phrases read awkwardly inline).
function naturalRef(K) {
  const k = K.toLowerCase();
  const map = [
    ['pick', 'guitar picks'], ['string', 'strings'], ['cable', 'instrument cables'],
    ['stand', 'guitar stands'], ['case', 'guitar cases'], ['tuner', 'tuners'],
    ['capo', 'capos'], ['strap', 'straps'], ['amp', 'amps'], ['pedal', 'pedals'],
    ['course', 'guitar courses'], ['lesson', 'guitar lessons'], ['book', 'guitar books'],
    ['app', 'guitar apps'], ['video', 'video lessons'], ['tutorial', 'video lessons'],
    ['tonewood', 'tonewoods'], ['bass', 'bass guitars'], ['acoustic', 'acoustic guitars'],
    ['electric', 'electric guitars'],
  ];
  for (const [needle, noun] of map) if (k.includes(needle)) return noun;
  return 'guitars';
}

function destuff(html, K) {
  const ref = naturalRef(K);
  const reFaq1 = new RegExp('Is it hard to start with ' + esc(K) + ' as a total beginner\\?', 'gi');
  const reFaq2 = new RegExp('Do I need to spend a lot on ' + esc(K) + ' right away\\?', 'gi');
  const reFaq3 = new RegExp('What if I need more help with ' + esc(K) + '\\?', 'gi');
  const reVerdict = new RegExp('In the end, the ' + esc(K) + ' is the one that inspired you to keep playing\\.', 'gi');
  const reWelcome = new RegExp('Welcome to the wonderful journey of finding the ' + esc(K) + '!', 'gi');
  const reLooking = new RegExp("When you're looking at the " + esc(K) + ',', 'gi');

  html = html
    .replace(reFaq1, 'Is this hard to get started with as a total beginner?')
    .replace(reFaq2, 'Do I need to spend a lot right away?')
    .replace(reFaq3, 'Where can I get more help choosing the right gear?')
    .replace(reVerdict, 'In the end, the best choice is the one that keeps you playing.')
    .replace(/\s*We're so excited for you to start playing!/gi, '')
    .replace(reWelcome, `Choosing the right ${ref} is easier than it used to be.`)
    .replace(reLooking, "When you're choosing,");

  // Catch-all: any remaining keyword mention (any case) -> natural category ref.
  html = html.replace(new RegExp(esc(K), 'gi'), ref);

  // Tidy whitespace introduced by removals.
  html = html.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+([.,!?])/g, '$1');
  return html;
}

const cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let before = 0, after = 0, capsBefore = 0;
for (const K of Object.keys(cache)) {
  const v = cache[K];
  before += v.toLowerCase().split(K.toLowerCase()).length - 1;
  capsBefore += v.split(K.toUpperCase()).length - 1;
  const nv = destuff(v, K);
  after += nv.toLowerCase().split(K.toLowerCase()).length - 1;
  cache[K] = nv;
}
fs.writeFileSync(FILE, JSON.stringify(cache, null, 2), 'utf8');
console.log(`content_cache.json: ${Object.keys(cache).length} entries`);
console.log(`exact-match keyword occurrences in body: ${before} -> ${after}`);
console.log(`ALL-CAPS keyword occurrences before: ${capsBefore} (now 0)`);

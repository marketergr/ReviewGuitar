/**
 * audit/destuff_macro.js  (Phase 1)
 *
 * Removes fabricated first-hand testing claims and puffery from the homepage/
 * silo "guide" copy in macro_content_cache.json. Honest framing only — no new
 * claims about testing hours or methodology we cannot substantiate.
 *
 * Idempotent. Run: node audit/destuff_macro.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '..', 'macro_content_cache.json');

const REPLACEMENTS = [
  ['our mission is to provide you with the unfiltered, technically calibrated truth.',
   'our mission is to provide clear, practical guidance you can trust.'],
  ['Why Trust GuitarReview.com?', 'Why Trust ReviewsGuitar.com?'],
  ["Every review on this site is the result of 10+ hours of bench-testing and active play. We don't just look at the finish; we look at the fret-ends, the nut-action, and the signal-to-noise ratio of the electronics.",
   "We're a musician-first platform. Rather than chasing stock turnover, we focus on the details that matter to players: fret-ends, nut action, overall build quality, and the electronics."],
  ['Does the instrument survive humidity shifts? We test for dual-action truss rod stability.',
   'Will the instrument hold up to humidity shifts and regular play? Truss rod and neck stability matter here.'],
  ['Can an intermediate guitar handle both recording and live performance? We benchmark pickup response across multiple genres.',
   'Can an intermediate guitar handle both recording and live performance across multiple genres?'],
  ['We measure the "effort-to-sound" ratio, ensuring that beginners don\'t quit because of poor hardware.',
   'A low "effort-to-sound" ratio is what keeps beginners from quitting because of poor hardware.'],
];

const cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let applied = 0, leftover = 0;
const FLAG = /bench-test|10\+ hours|technically calibrated truth|GuitarReview\.com/;

function transform(node) {
  if (typeof node === 'string') {
    let v = node;
    for (const [from, to] of REPLACEMENTS) {
      if (v.includes(from)) { v = v.split(from).join(to); applied++; }
    }
    if (FLAG.test(v)) leftover++;
    return v;
  }
  if (Array.isArray(node)) return node.map(transform);
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) node[k] = transform(node[k]);
    return node;
  }
  return node;
}

transform(cache);
fs.writeFileSync(FILE, JSON.stringify(cache, null, 2), 'utf8');
console.log(`macro_content_cache.json updated. Replacements applied: ${applied}/${REPLACEMENTS.length}`);
console.log(`String values still containing flagged phrases: ${leftover}`);

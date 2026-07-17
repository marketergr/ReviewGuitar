# ReviewsGuitar — Koray Visual-Semantics Action Plan

Applied methodology: Koray Tuğberk GÜBÜR visual-semantics SEO. This is the plan to convert the
site from "discovered, not indexed" into ranked, traffic-earning pages.

_Last updated: 2026-07-17_

---

## 1. Diagnosis (grounded in your own GSC data)

- **2026-04-11:** "Not indexed" jumped from **7 → 869** in a single day. Google discovered the
  entire programmatic cluster and refused to index ~94% of it (`Discovered – currently not indexed`).
- Current state: ~56 indexed, **60–80 impressions/day**. Near-zero organic.
- **This is a scaled-content classification, not a design problem.** 383 near-identical
  template pages published as one dump → Google clusters them as automated and declines to index.

Per the publishing-cadence reference: *"If the system classifies you as fully automated, the
classification wins regardless of what else you have."* Tuning individual page layouts will not
lift a population that's been classified. The fix is **distinct, genuinely useful pages** +
**clean velocity** + **de-duplicated templates** + **external consensus.**

---

## 2. What was shipped this session (the free-tool doctrine)

AI Overviews absorb informational clicks but **cannot absorb tool clicks** — a user tuning a
guitar has to land somewhere and do it. You had zero tools. Now live:

| Page | URL | Query it owns |
|---|---|---|
| Online Guitar Tuner | `/tools/guitar-tuner` | "online guitar tuner" (mic + by-ear) |
| Online Metronome | `/tools/metronome` | "online metronome", "guitar metronome" |
| String Tension Calculator | `/tools/string-tension-calculator` | "string tension calculator" (D'Addario-accurate) |
| Guitar Chord Finder | `/tools/chord-finder` | "guitar chords", "chord finder" |
| Tools hub | `/tools/` | "free guitar tools" |

Each follows the page-architecture doctrine: giant self-evident **centerpiece**, discrete
**attribute badges** (`Free` · `No sign-up` · …), **2% token rule** (entities front-loaded),
custom `rg-*` class scheme (no generator fingerprint), `WebApplication` + `FAQPage` schema, and a
**CTA into the affiliate money path** (tuner→tuners, tension→strings, chords→courses).

Wired for indexing: homepage nav + hero strip, footer column, sitemap (priority 0.9),
cross-links between every tool. **A new page linked from your highest-authority page (the
homepage) indexes far faster than an orphan.**

---

## 3. The click-test patience rule — READ THIS BEFORE TOUCHING ANYTHING

Once a tool page is built correctly, **stop editing it.** Google runs a click test that takes
weeks. Every core update a sound page climbs; sometimes it drops 50% — that's the test, not a
failure. Editing a sound page **resets** the confidence Google is building.

Koray's audio-to-text case went 0 → ~8,000 clicks/day with **zero** changes after launch.
Do not "optimize" these tools because they haven't moved in week 2. Leave them.

---

## 4. Publishing cadence — the constraint everything else lives inside

**Do not dump pages again.** The 04-11 spike is exactly the pattern that got you classified.

Rules going forward:
- **New `/tools/` subfolder:** publish the 4 tools now, then let the subfolder **mature ~3 months**
  at low volume while it accrues click data. Add 1 new tool every ~2–3 weeks, not in a batch.
- Never publish a constant number/day (a flat line is the most machine-like pattern). Vary it,
  include zero days, correct across weeks not within days.
- Front-load quality: the early pages carry the click signal that buys tolerance for later ones.
- Next tools to add (spread out, one at a time): **capo/transpose tool**, **scale/fretboard
  visualizer**, **BPM tap tool**, **chord progression generator**, **strumming pattern trainer**.

---

## 5. Prune / consolidate the thin cluster (concentrate quality)

The 857 unindexed URLs are dragging the whole domain's quality score. The thin `/buy/{spec}/`
pages (e.g. `guitar-nut-bone`, `guitar-neck-shape-wide-thin`) were already 410'd in `.htaccess` —
but **the site is on Vercel, which ignores `.htaccess`.** Action:

- [ ] Port the `/buy/` 410 (or at minimum 404/301) handling into `vercel.json` so those URLs
      actually return Gone/redirect on production, not soft-404. `.htaccess` is dead weight on Vercel.
- [ ] Audit `/pages/*` (147 SEO landing pages) and `/collections/*` comparisons: any page under
      ~150 words of unique value that shares intent with a sibling → **consolidate** into the
      parent hub and 301 the URL (QDL — "deserves a link, not a page"). Fewer, deeper pages beat
      many thin ones.
- [ ] Target: the indexable set should be pages you'd defend individually. If you wouldn't, merge it.

---

## 6. External topical map / entity graph (this is where traffic actually comes from)

Internal assertions don't create consensus — only external sources do, and consensus is what
LLMs (and increasingly Google) answer from. For every important page, get external content that
**mentions** you and makes a **claim** about you, not just a link.

**Collect all three from every placement:** PageRank (the link) + Mention (brand named) + Claim
(a specific, true assertion). The claim is what wins AI citations and nobody else collects it.

Concrete, honest, doable for this site:
- [ ] Get the free tools mentioned on guitar subreddits / forums **by being genuinely useful** —
      answer "how do I tune without a tuner" with the tool. (Real participation, not spam. Let the
      account/community accrue history first — same 3-month maturation logic.)
- [ ] Guitar-adjacent blogs / roundups of "free guitar tools" → pitch inclusion. Claim to seed:
      *"ReviewsGuitar's string tension calculator uses D'Addario's published unit weights."* (True.)
- [ ] Expand `sameAs` in your Organization schema beyond the single Pinterest link: YouTube,
      a real author profile, any directory listing. One `sameAs` is a thin entity.
- [ ] **Content pumping:** each tool = a short YouTube demo → Shorts/Reels/TikTok, a Reddit post,
      a Pinterest pin (you already do Pinterest). Same asset, every surface, native uploads.

Hard constraint from the skill: **every claim must be true.** Manufactured agreement about a
false claim is fraud when money's involved. Claim only real superlatives.

---

## 7. Measurement — run before making more structural changes

Search Console now reports AI Overview impressions separately. Export and join:
1. AI impressions per page
2. Regular web impressions per page
3. Crawl data per page, segmented by Google user agent

Look for: which content styles win AI impressions, which subfolders get chosen, which sentence
openings appear in citations. **That joined dataset drives the next topical-map changes — not guesses.**

---

## 8. Do-not-do list (from the skill's scope notes)

- ❌ No sockpuppet/farmed account networks, no proxy warming. Build real owned properties instead.
- ❌ No bait-and-switch commercial layouts. The tool CTAs go to pages that honour the promise.
- ❌ Don't fake attribute badges or claims. A false attribute is the fastest way to burn the entity.

---

## Priority order (next 8 months)

1. **Now:** ship tools (done), fix `/buy/` handling in `vercel.json`, expand `sameAs`.
2. **Weeks 1–4:** consolidate the thinnest `/pages` + comparison URLs; 301 the merges.
3. **Months 1–3:** let `/tools/` mature; add 1 tool every 2–3 weeks; start honest off-site mentions.
4. **Months 3–8:** ramp content on matured subfolders at randomised velocity; build the external
   claim map; re-run the GSC join and reshape the topical map from data.
5. **Throughout:** leave sound pages alone. Patience is the strategy.

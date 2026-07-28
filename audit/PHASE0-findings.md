# Phase 0 — Findings, source→output map & execution strategy

_Branch `seo-remediation`, baseline commit `3be62b8` (the uncommitted site-wide markup/CSS refactor, persisted). Data: `audit/seo-audit.md` + `audit/seo-audit.json` (413 pages)._

## Execution strategy (proven, not assumed)

**Fix at the source layer (generators / data / `content_cache`), then regenerate.** A reproducibility test proved this is safe:
- `node generate_seo.js` → regenerated 84 pages with **only 1 line changed per file** (the `article:published_time` timestamp). Markup, filler, badges, H1s reproduced **identically**.
- `generate_comparisons.js` / `generate_high_ticket.js` likewise reproduce current output; **affiliate links are untouched by every regeneration** (verified by diff).
- ∴ generators are in sync with the refactored working tree → editing a generator + regenerating yields **only the intended change** (plus a benign timestamp).

**Monetization invariant:** 32 unique Amazon ASINs, all `https://www.amazon.com/dp/{ASIN}/?tag=reviewsguitar-20` (1805 occurrences, tag 100% consistent). Snapshot: `audit/affiliate-baseline.txt`. After every phase: `node audit/affiliate_manifest.js /tmp/after.txt && diff audit/affiliate-baseline.txt /tmp/after.txt` must be empty.

## Source → output map

| Generator | Writes | Notes |
|---|---|---|
| `generate_seo.js` | `pages/*.html` (84 SEO landing pages) | **Primary filler source** |
| `generate_pages.js` | `collections/{silo}/*.html` hubs + product pages | product cards, cross-silo box |
| `generate_comparisons.js` | `collections/{silo}/*-vs-*.html` (184) | |
| `generate_high_ticket.js` | `pages/bofu_*.html` (premium/BOFU) | |
| `generate_sitemap.js` / `generate_nav.js` / `generate_redirects.js` | `sitemap.xml` / `navigation.html` / redirects | Phase 3 |
| `minify.js` / `validate_routes.js` | `css/style.min.css` / validates `vercel.json` | run after edits |

**Data:** `products.json` (specs, ASINs, prices, ratings, `amazonLink`), `content_cache.json` (deep body copy), `macro_content_cache.json` (intros), `site-structure.json` (silos/keywords), `navigation.json`.

## Where each issue originates (fix targets)

| Issue | Pages | Source location |
|---|---|---|
| `ELITE VERIFIED` / `10+ HOURS TESTED` badges | 101 | `generate_seo.js` ~L220-222 (+ product-card path) |
| `TECHNICAL CALIBRATION` + `VERDICT` filler | 85 / 84 | `generate_seo.js` ~L549-562 |
| `Structural Integrity Matrix` etc. pseudo-criteria | — | `generate_seo.js` ~L96 |
| Keyword stuffing (exact match >3× in body) | 117 | `generate_seo.js` (keyword var reused, UPPERCASED, in H1/title/og/schema/FAQ) + `content_cache.json` copy |
| Fabricated `AggregateRating` (e.g. 4.8/254, 4.9/55) | 121 | hardcoded in generators (`generate_seo.js`, `generate_pages.js`); **remove per guardrails** |
| Fender CD-60S "Solid Mahogany Top" | spec | `products.json` (standard CD-60S = solid **spruce** top; confirm ASIN `B071FV8G1Z`) |
| `ReviewsGuitar Editorial Team` author | only 5 | `fix_content_quality.js` L134 injects it (script not run on current tree) — Phase 2 replaces with real author scaffolding sitewide |
| `homepage "10,000+ hours of bench-testing"` | 1 | `index.html` |
| Homepage Unsplash stock images | 1 | `index.html` (`images.unsplash.com`) |

## Key technical findings (Phase 3 inputs)

- **Canonical mismatch:** 268 pages have `.html` canonicals while Vercel `cleanUrls:true` serves clean URLs. **147 underscore URLs** in `pages/` are the full-migration targets.
- **42 missing canonical / 39 missing `<title>`** — same set of `collections/electric/*-vs-*` pages. These are **orphaned, malformed, stale files** no current generator writes (broken `<head>`, drops into `<li>` fragments). Phase 3: check reachability (sitemap/`vercel.json` rewrites/internal links) → repair or 301-redirect + remove.
- **No `FAQPage` / `BreadcrumbList` schema** despite visible FAQ + breadcrumb markup (Phase 3).
- **`article:published_time` re-stamps to "now" on every regen** (`generate_seo.js`) — minor SEO smell; stabilize to a fixed publish date + use `modified_time` for updates.
- **Internal links:** `{{relatedLinks}}` placeholder in `page-template.html` is unused; no lateral sibling linking (Phase 4).
- **Images:** missing `width`/`height`, inconsistent `loading="lazy"` (Phase 3).
- 101 thin pages (<300 visible words); 4 duplicate meta-description groups; 0 duplicate titles (besides the 39 missing).

## No `package.json`
Generators use only Node built-ins; run directly (`node generate_seo.js`). Run `node minify.js` after CSS edits and `node validate_routes.js` after routing changes.

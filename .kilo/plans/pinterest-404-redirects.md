# Pinterest 404 → 301 Redirect Plan

## Goal
Capture SEO juice from the previous site owner’s Pinterest pins by adding 301 redirects from old Pinterest URLs to current live pages on `reviewsguitar.com`.

## Current State
- Old Pinterest URLs follow pattern: `https://reviewsguitar.com/guitar-{product-slug}/`
- The site currently has no redirect rules for these URLs.
- Existing redirect config: `vercel.json` (Vercel) and `generate_redirects.js` (also generates `.htaccess`).
- Current live pages are at `/collections/{silo}/{slug}.html` and `/pages/{slug}.html`.

## Example
Broken: `https://reviewsguitar.com/guitar-yamaha-pacifica-311h-electric-guitar-in-vintage-white/?utm_source=Pinterest&utm_medium=organic`

## Approach

### Option A: Scrape Pinterest Profile (Automated)
- Write a Node script to fetch `https://gr.pinterest.com/reviewsguitar/` and extract all pin URLs.
- Filter for `reviewsguitar.com` domains.
- Parse slug to extract product keyword.
- Map keyword to current live URL using fuzzy match (e.g., `yamaha-pacifica` → `/collections/electric/yamaha-pacifica-112v`).
- Regenerate `vercel.json` redirects and `.htaccess` rules for matched URLs.

### Option B: CSV Export from Pinterest (Preferred)
- User exports `reviewsguitar.com` URLs from Pinterest Analytics.
- Script reads CSV/JSON, maps each old URL to a current live page via keyword or a user-provided mapping file.
- Regenerate `vercel.json` redirects and `.htaccess` rules.

### Option C: Catch-All Pattern (Simplest)
- Add a catch-all Vercel rewrite/redirect:  
  `"/guitar-:slug*"` → `"/?utm_source=Pinterest&utm_medium=organic"` or to the homepage.
- Pros: captures all traffic immediately with zero scraping.  
- Cons: loses page-level SEO relevance (less link equity transfer to specific content).

## Proposed Mapping Strategy
1. Build a lookup table from `site-structure.json` + `sitemap.xml` keywords.
2. For each broken Pinterest slug, find the best matching current page by keyword overlap.
3. Write explicit 301 rules (no catch-all) to preserve maximum SEO juice, with a final catch-all to homepage as fallback.

## Files to Modify
- `vercel.json` — add new `redirects` entries.
- `.htaccess` — add `RewriteRule` entries.
- `generate_redirects.js` — update to include Pinterest URLs (so regeneration stays in sync).
- New helper: `scripts/map_pinterest_redirects.js` — reads Pinterest export (or scraped list), writes JSON mapping and feeds into redirect generators.

## Open Questions
1. Do you have a Pinterest Analytics export (CSV/JSON) with the pin URLs, or should I build a scraper for `https://gr.pinterest.com/reviewsguitar/`?
2. For unmatched pins (no clear current page), should they:
   - Redirect to the homepage, OR
   - Redirect to the most relevant silo index (e.g., `/collections/electric/`), OR
   - 404 with a custom page that links to the current site?
3. Should UTM parameters (`utm_source=Pinterest&utm_medium=organic`) be preserved on the destination URLs for analytics?

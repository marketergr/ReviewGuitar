# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReviewGuitar is a **programmatic SEO affiliate marketing website** for guitar reviews and buying guides, deployed at https://reviewsguitar.com. It is a **static HTML site** hosted on Vercel with clean URL routing via rewrites.

## Generation Commands

There is **no package.json** — scripts use only Node.js built-ins and are run directly:

```bash
node generate_seo.js          # Regenerate 84 SEO landing pages (long-tail keywords)
node generate_pages.js        # Regenerate collection/product pages
node generate_comparisons.js  # Regenerate 223+ product comparison pages
node generate_sitemap.js      # Regenerate sitemap.xml
node generate_nav.js          # Regenerate navigation.html
node generate_redirects.js    # Regenerate redirect rules
node minify.js                # Minify CSS → css/style.min.css
node validate_routes.js       # Validate vercel.json routes point to real files
```

Run `validate_routes.js` after any routing changes or page additions.

## Architecture

### Content Model

Pages are generated from JSON data files, not written by hand:

- **`products.json`** — product catalog (~100 items with ASINs, prices, ratings, Amazon affiliate links)
- **`site-structure.json`** — 5 silos (acoustic, electric, accessories, learning, buying), categories, and keywords
- **`content_cache.json`** — AI-generated deep content blocks (204 KB); cached to avoid regeneration
- **`macro_content_cache.json`** — Homepage, silo, and cluster intro copy
- **`navigation.json`** — Nav structure consumed by `generate_nav.js`

### URL Routing (Two Layers)

1. **Vercel rewrites** (`vercel.json`): 95+ rules map clean URLs to physical HTML files
   - `/best/{keyword}` → `/pages/acoustic_beginner_*.html`
   - `/vs/{comparison}` → `/collections/acoustic/*.html`
   - `/reviews/{product}` → `/collections/{silo}/*.html`

2. **Apache redirects** (`.htaccess`): 301s from legacy `/silos/` paths to `/collections/`

When adding new pages, a new rewrite rule in `vercel.json` is required. Always run `validate_routes.js` after.

### Page Types

| Path | Content |
|------|---------|
| `index.html` | Homepage |
| `collections/{silo}/index.html` | Silo hub pages |
| `collections/{silo}/{product}.html` | Individual product reviews |
| `pages/{silo}_{category}_{keyword}.html` | SEO landing pages (84 total) |

### Design System

- Dark theme: background `#050505`, primary accent `#ffb700` (amber/gold), text `#f5f5f5`
- Fonts: Montserrat (display/headings), Inter (body)
- Responsive with mobile-first media queries
- Much styling is inline via `style=""` attributes within generated HTML

### SEO & Affiliate Patterns

- Every page includes JSON-LD Product schema with `AggregateRating`
- All Amazon links must use the Associates tag and include an FTC affiliate disclosure
- Meta titles ≤ 70 chars, meta descriptions ≤ 160 chars
- Internal linking connects pages within the same silo

## Key Existing Documentation

- `IMPLEMENTATION_SUMMARY.md` — details on all 6 SEO capabilities
- `DEPLOYMENT_CHECKLIST.md` — pre-launch checklist
- `GSC/` — Google Search Console exports (performance data, critical issues)

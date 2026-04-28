# Nav Dropdown Hover Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix nav dropdown submenus disappearing when the cursor moves from a nav item toward the dropdown.

**Architecture:** Replace the CSS-only hover trigger with a JS hover-intent pattern using an `is-open` class. A 150ms close timer lets the cursor move diagonally without losing the menu. Mobile gets click/tap toggle instead.

**Tech Stack:** Vanilla CSS, Vanilla JS (no build step needed for JS). CSS minified via `node minify.js`.

---

### Task 1: Fix dropdown CSS in `css/style.css`

**Files:**
- Modify: `css/style.css:110-143` and `css/style.css:296-307`

- [ ] **Step 1: Replace the `.dropdown-content` block (lines 110–122)**

  Find and replace this entire block:

  ```css
  .dropdown-content {
      display: none;
      position: absolute;
      background: rgba(10, 10, 10, 0.95);
      backdrop-filter: blur(15px);
      min-width: 220px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      z-index: 1000;
      border: 1px solid var(--border);
      border-radius: 4px;
      margin-top: 1rem;
      padding: 1rem 0;
  }
  ```

  With:

  ```css
  .dropdown-content {
      display: none;
      position: absolute;
      top: 100%;
      margin-top: 0;
      background: rgba(10, 10, 10, 0.95);
      backdrop-filter: blur(15px);
      min-width: 220px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      z-index: 1000;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1rem 0;
  }

  .dropdown-content::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 0;
      right: 0;
      height: 8px;
  }
  ```

- [ ] **Step 2: Replace the CSS hover open rule (line 141–143)**

  Find:

  ```css
  .dropdown:hover .dropdown-content {
      display: block;
  }
  ```

  Replace with:

  ```css
  .dropdown.is-open .dropdown-content {
      display: block;
  }
  ```

- [ ] **Step 3: Fix the mobile media query (around line 305–307)**

  Find:

  ```css
  .dropdown:hover .dropdown-content {
      display: block;
  }
  ```

  Replace with:

  ```css
  .dropdown.is-open .dropdown-content {
      display: block;
  }
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add css/style.css
  git commit -m "fix: replace CSS hover dropdown with is-open class, add invisible bridge"
  ```

---

### Task 2: Add JS hover intent to `index.html`

**Files:**
- Modify: `index.html:327-338` (the inline `<script>` block at bottom of file)

- [ ] **Step 1: Replace the existing script block**

  Find:

  ```html
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
  ```

  Replace with:

  ```html
  <script>
      document.addEventListener('DOMContentLoaded', () => {
          const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
          const navLinks = document.querySelector('.nav-links');

          if (mobileMenuToggle && navLinks) {
              mobileMenuToggle.addEventListener('click', () => {
                  navLinks.classList.toggle('active');
              });
          }

          const isMobile = () => window.innerWidth <= 768;

          document.querySelectorAll('.dropdown').forEach(dropdown => {
              let closeTimer = null;

              dropdown.addEventListener('mouseenter', () => {
                  if (isMobile()) return;
                  clearTimeout(closeTimer);
                  dropdown.classList.add('is-open');
              });

              dropdown.addEventListener('mouseleave', () => {
                  if (isMobile()) return;
                  closeTimer = setTimeout(() => {
                      dropdown.classList.remove('is-open');
                  }, 150);
              });

              const trigger = dropdown.querySelector('a');
              trigger.addEventListener('click', (e) => {
                  if (!isMobile()) return;
                  e.preventDefault();
                  const isOpen = dropdown.classList.contains('is-open');
                  document.querySelectorAll('.dropdown.is-open').forEach(d => d.classList.remove('is-open'));
                  if (!isOpen) dropdown.classList.add('is-open');
              });
          });

          document.addEventListener('click', (e) => {
              if (!e.target.closest('.dropdown')) {
                  document.querySelectorAll('.dropdown.is-open').forEach(d => d.classList.remove('is-open'));
              }
          });
      });
  </script>
  ```

- [ ] **Step 2: Verify in browser (desktop)**

  Open `index.html` in a browser. For each nav dropdown (Acoustic, Electric, Gear, Education):
  - Hover the nav item — dropdown appears
  - Move cursor diagonally toward the dropdown — dropdown stays open
  - Move cursor off the dropdown entirely — dropdown closes after ~150ms
  - Click a dropdown link — it navigates correctly

- [ ] **Step 3: Verify in browser (mobile)**

  Open browser DevTools, switch to a mobile viewport (≤768px):
  - Tap the hamburger menu — nav opens
  - Tap a dropdown label (e.g. "Acoustic") — submenu toggles open; page does NOT navigate
  - Tap the same label again — submenu closes
  - Tap outside the nav — all dropdowns close

- [ ] **Step 4: Commit**

  ```bash
  git add index.html
  git commit -m "fix: add hover-intent JS for nav dropdowns, click-toggle on mobile"
  ```

---

### Task 3: Rebuild minified CSS

**Files:**
- Modify: `css/style.min.css` (auto-generated)

- [ ] **Step 1: Run the minifier**

  ```bash
  node minify.js
  ```

  Expected: `css/style.min.css` updated with no errors printed.

- [ ] **Step 2: Commit**

  ```bash
  git add css/style.min.css
  git commit -m "chore: rebuild minified CSS after dropdown fix"
  ```

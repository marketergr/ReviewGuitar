# Nav Dropdown Hover Fix — Design Spec

## Problem

The dropdown submenus disappear when the user moves the cursor from a nav item toward the dropdown. Root cause: `margin-top: 1rem` on `.dropdown-content` creates a 16px gap that falls outside the `.dropdown` hover zone.

## Solution: JS Hover Intent + CSS Bridge

### CSS Changes (`css/style.css`)

1. Replace `margin-top: 1rem` with `top: 100%; margin-top: 0` on `.dropdown-content` — positions the dropdown flush below the nav item.
2. Add `.dropdown-content::before` pseudo-element: `position: absolute; top: -8px; height: 8px; width: 100%` — invisible bridge that fills the gap so the cursor stays within the hover zone.
3. Remove `.dropdown:hover .dropdown-content { display: block; }` — JS controls visibility instead.
4. Mobile media query: also remove the `.dropdown:hover` rule there.

### JS Changes (`index.html` inline script)

- `mouseenter` on `.dropdown` → add class `is-open`, cancel any pending close timer.
- `mouseleave` on `.dropdown` → set 150ms timer to remove `is-open`.
- CSS shows `.dropdown.is-open .dropdown-content { display: block; }`.
- On mobile (≤768px): `click` on `.dropdown > a` → toggle `is-open`, `preventDefault()` to block navigation. Clicking outside closes all open dropdowns.

### Scope

Fix applied to `index.html` only. Other pages share the same nav pattern and can be updated by copying the JS block once the fix is confirmed.

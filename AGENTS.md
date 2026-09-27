# AGENTS.md

Guidance for future AI agents (and humans) working on this repository.

## What this project is

A static, single-page restaurant menu/ordering website for "Rishi Restaurants" — no server, no build step, no database. Cart state lives entirely client-side in `localStorage`.

## Architecture

- `index.html` — all markup. Sections are in visual order: loader → header/nav → mobile nav → hero → highlights → chef's specials → menu (search + category filters) → about → contact → footer → cart drawer → toast → back-to-top. Menu/specials/category-filter/footer-category content is injected by JavaScript at runtime — the corresponding containers in the HTML (`#menu-grid`, `#specials-grid`, `#category-filters`, `#footer-categories`) are intentionally near-empty.
- `js/menu-data.js` — the single source of truth for dish and category content (`MENU_ITEMS`, `CATEGORIES`). No rendering logic here, just data plus the `IMG()` helper that builds Netlify Image CDN URLs.
- `js/script.js` — an IIFE that renders everything from `menu-data.js` and wires up all interactivity: category filtering, search (both the header overlay search and the in-menu search stay in sync), the cart (add/remove/qty/clear/checkout, persisted to `localStorage` under the key `rishi-restaurants-cart`), mobile nav, sticky header, scroll-spy nav highlighting, back-to-top, and IntersectionObserver-based reveal animations. Cart-related DOM updates go through `syncCartUI()`, which patches existing cards in place rather than re-rendering the whole grid (so filtering/search state isn't lost when the cart changes).
- `css/style.css` — one stylesheet, organized top-to-bottom to mirror the page's section order. Color/spacing/shadow/radius are all CSS custom properties in `:root` — change the palette there, not by hunting for hex codes.
- `img/` — 21 AI-generated food photographs (20 dishes + `hero-bg.jpg`), referenced everywhere through `/.netlify/images?url=/img/<file>&w=<n>&fm=webp&q=80` (see the `netlify-image-cdn` skill) rather than directly, so images are resized/re-encoded on demand instead of shipping full-resolution originals.

## Conventions / gotchas

- Every dish in `MENU_ITEMS` needs a matching file in `img/`. Keep filenames referenced via the `IMG()` helper in `menu-data.js`.
- Dish IDs (`item.id`) are used as `data-*` attribute values and as `localStorage` cart keys — keep them unique, lowercase, hyphenated.
- Watch CSS specificity when toggling visibility with the `hidden` attribute: `[hidden]` and a same-weight class selector are equal specificity, so a later class rule (e.g. `.add-to-cart-btn { display: flex }`) silently wins and un-hides the element. This bit us once with the add-to-cart button vs. its quantity stepper — the fix was an explicit `.add-to-cart-btn[hidden] { display: none; }` rule. Apply the same pattern for any other `hidden`-attribute toggle added later.
- No bundler, no npm dependencies, no `package.json` — keep it that way. If a future milestone needs a backend (orders, real payments, accounts), that's new infrastructure, not an extension of this static frontend.

## Verifying changes

There's no test suite. Verify with `netlify dev --port 8889` and either a manual browser check or a quick Playwright script (see the `run` skill's `examples/playwright.md`) driving: category filter clicks, search input, add-to-cart + cart drawer, and a page reload to confirm `localStorage` persistence. Check the browser console for errors — this project should have zero.

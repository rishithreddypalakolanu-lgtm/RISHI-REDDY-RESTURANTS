# Rishi Restaurants

A modern, fully responsive digital restaurant menu and ordering site for **Rishi Restaurants**, built as a single static site with vanilla HTML, CSS, and JavaScript.

## What this is

- A sticky-header marketing + menu site: hero, chef's specials, a full 10-category menu with search and filtering, an about section, contact details with a map, and a footer.
- A working shopping cart (add/remove items, adjust quantity, subtotal/total, clear cart) persisted in the browser via `localStorage` — no backend required.
- 21 custom AI-generated food photographs (one per dish plus a hero banner), served through Netlify's Image CDN for automatic resizing/format optimization.

## Technology

- **HTML5** — single page (`index.html`), semantic markup (header/nav/main/section/footer/aside).
- **CSS3** — `css/style.css`, custom properties for the brand palette (dark brown, cream, gold, white), Flexbox/Grid layout, responsive breakpoints, transitions and scroll-reveal animations.
- **JavaScript (vanilla)** — `js/menu-data.js` holds all dish/category content; `js/script.js` renders the menu, wires up filtering/search, and manages the cart.
- **Font Awesome** (CDN) for icons, **Google Fonts** (Playfair Display + Poppins) for typography.
- **Netlify Image CDN** (`/.netlify/images?...`) transforms the source JPEGs in `img/` to right-sized WebP on demand.

## Running locally

No build step or dependencies are required — it's static HTML/CSS/JS. To preview with full Netlify platform emulation (including Image CDN):

```bash
netlify dev --port 8889
```

Then open `http://localhost:8889`.

## Project structure

```
index.html          # all page markup/sections
css/style.css        # all styling
js/menu-data.js       # dish + category data (edit this to add/change menu items)
js/script.js          # rendering, filtering, search, and cart logic
img/                  # source food photography (referenced via Image CDN)
netlify.toml          # static publish config
```

## Editing the menu

Add, remove, or edit dishes by editing the `MENU_ITEMS` array in `js/menu-data.js` — the rest of the site (menu grid, chef's specials, category filters, cart) reflects changes automatically. Category labels/icons live in the `CATEGORIES` array in the same file. Place any new dish photo in `img/` and reference it with the `IMG("filename.jpg")` helper.

## Contact details

The address, phone, email, and hours in the Contact and Footer sections are placeholders — swap them for the real restaurant details before going live. The map embed is a generic placeholder; replace the iframe `src` with a real Google Maps embed URL for the actual location.

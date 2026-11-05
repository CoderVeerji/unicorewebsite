# Unicore Lubricants — Project State

## What this is

A static marketing site for **Unicore Lubricants**, an Indian B2B lubricant manufacturer. Plain HTML pages styled with the Tailwind Play CDN. There is no build step.

The flagship product is **Tyre Sealant Gel**. It has its own page (`tyre-sealant.html`) and must **never** appear in the main product grid.

### Pages

| File | Purpose |
|---|---|
| `index.html` | Home |
| `products.html` | Product catalogue (**broken, being rebuilt**) |
| `product-detail.html` | Product detail template |
| `tyre-sealant.html` | Tyre Sealant Gel flagship page |
| `applications.html` | Applications & sectors |
| `about.html` | About Unicore |
| `dealership.html` | Dealership network and application |
| `contact.html` | Contact / enquiry |
| `docs/DESIGN.md` | Design system spec |
| `docs/screens/` | Reference screenshots: `home.png`, `products.png`, `contact.png`, `dealership.png` |

Pages without a destination yet: Safety Data Sheets, Terms of Trade, Privacy Policy. Their footer links remain `href="#"`.

## Design system

Source: `docs/DESIGN.md` and the `tailwind.config` block in each HTML file (the 10 colours and 2 fonts are identical across all eight files).

### The ten brand colours

| Tailwind token | Hex | DESIGN.md name |
|---|---|---|
| `white` | `#FFFFFF` | white |
| `page-bg` | `#FAFAF8` | page-background |
| `product-frame` | `#F3F3F0` | product-frame-ground |
| `hairline` | `#E6E6E2` | hairline |
| `structural-line` | `#D8D8D3` | structural-line |
| `heading-black` | `#0B0B0C` | heading-black |
| `body-text` | `#434751` | body-text |
| `light-text` | `#737783` | light-text |
| `logo-blue` | `#1B4FA0` | logo-blue |
| `deep-navy` | `#143A78` | deep-navy |

The palette is limited to these ten. (DESIGN.md also lists Material-style alias tokens such as `primary` and `surface`. They map onto these ten values and are not used in the HTML config.)

### Fonts

- **Instrument Serif** (`font-serif`): display headings, section headings, card titles and index numerals.
- **Inter** (`font-sans`): body text and UI.
- No other typefaces and no icon fonts.

### Shadows

**All box shadows are forbidden except the desktop Products dropdown.** Each page has a global `* { box-shadow: none !important; }` reset, plus a `.dropdown-shadow` class that restores a shadow for that one dropdown.

Other rules from DESIGN.md: 2px corner radius on buttons and inputs, otherwise square corners.

## Shared shell

Each page carries its own copy of the following. **Nothing is shared yet; it is duplicated in every file.**

- Canonical two-row fixed header (Deep Navy utility bar plus main nav)
- Mobile drawer (`#mobile-menu-drawer`)
- Drawer script
- Four-column footer

Files with the canonical shell (7): `index.html`, `product-detail.html`, `tyre-sealant.html`, `applications.html`, `about.html`, `dealership.html`, `contact.html`.

`products.html` does **not** have it (see below). Any change to the shell currently means editing every file.

## Known issues

### `products.html` (rebuild in progress — do not patch)

1. **Seven duplicated `<header>` elements.** There should be one. This also produces duplicate IDs (`mobile-nav-toggle`, `burger-icon`, `close-icon` ×7).
2. **Six missing category section headings.** The headings of the six category sections (`#engine-oils`, `#gear-oils`, `#coolants`, `#greases`, `#tractor-oils`, `#industrial-hydraulic-oils`) have been overwritten.
3. **Non-canonical footer with invented links**, e.g. "Technical Data Sheets (TDS)", "Quality Standard Disclosures", "Storage & Handling Guidelines". None of these were requested or confirmed.
4. **Mobile menu script is broken.** It references element IDs that no longer exist (`mobile-menu-btn`, `mobile-close-btn`), so the burger does nothing.
5. **No box-shadow reset.** The `* { box-shadow: none !important; }` rule is missing, so the no-shadow rule is not enforced.
6. **SVG icons** (23) where every other page uses the text characters ▼ ☰ ×.

The link-rewrite pass touched only `href="#"` values on this page. Nothing else was changed.

### Other pages

- Some enquiry links point at anchors that don't exist on their own page:
  - `applications.html` links to `#enquiry-form`, but the section is `id="trade-enquiry"`.
  - `contact.html` links to `#dealership-application`, which only exists on `dealership.html`.

  These were left exactly as authored.
- `products.html` uses `#tractor-oils` for the Agricultural Oils section, while the rest of the site calls it `agricultural-oils`. Cross-page links to that category go to `products.html#tractor-oils`.
- `tyre-sealant.html` has one breadcrumb "Home" link with no `data-path`. It is still `href="#"`.
- `tyre-sealant.html` carries 8 ▼ characters, more than other pages. Not yet reviewed.

## Content blockers

Everything below is still `[to be confirmed by Unicore]` and is awaiting client input:

- Every product name
- Every pack size
- Phone numbers
- Email addresses
- Address
- GSTIN
- The **entire Tyre Sealant Gel dosage table**

All **eight photograph frames** are empty placeholders awaiting real product and plant photography.

## Rule for future work

**No technical claim, certification, standard number, capacity figure or packaging detail goes on this site unless the client has confirmed it.** Anything unconfirmed stays as `[to be confirmed by Unicore]`.

## Next steps (in order)

1. Rebuild `products.html`.
2. Move the header, footer and drawer script into shared components so they exist once.
3. Fill in content when the client supplies it.
4. Add scroll and hover animation last, once the layout is final.

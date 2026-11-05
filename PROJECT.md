# Unicore Lubricants — Project State

## What this is

A static marketing site for **Unicore Lubricants**, an Indian B2B lubricant manufacturer. It is an [Astro](https://astro.build) project with Tailwind CSS v3, built to plain static HTML.

The flagship product is **Tyre Sealant Gel**. It has its own page (`tyre-sealant`) and must **never** appear in the main product grid.

## Run and build locally

Needs Node 22.23+ (Astro 7).

```sh
npm install        # once
npm run dev        # dev server at http://localhost:4321
npm run build      # static site into dist/
npm run preview    # serve dist/ to check the production build
```

The build writes flat files (`dist/about.html`, `dist/products.html`, ...) so the existing relative links (`about.html`, `products.html#engine-oils`) work as written, both locally and on any static host.

## Structure

```
src/
  layouts/Base.astro          html shell, fonts, global CSS, view transitions, header/drawer/footer
  components/Header.astro     canonical two-row fixed header   (prop: active, enquiryHref)
  components/MobileDrawer.astro  full-screen mobile drawer + its script (same props)
  components/Footer.astro     canonical four-column footer    (prop: active)
  pages/                      one file per page, each holding only that page's <main>
    index.astro  products.astro  product-detail.astro  tyre-sealant.astro
    applications.astro  about.astro  dealership.astro  contact.astro
  styles/global.css           Tailwind layers, box-shadow reset, scrollbar
  styles/motion.css           animation CSS (see below)
  scripts/motion.js           animation JS (see below)
tailwind.config.mjs           the ten brand colours + two font families
postcss.config.cjs            tailwind + autoprefixer
astro.config.mjs              compressHTML off (markup is emitted as authored)
docs/DESIGN.md                design system spec
docs/screens/                 reference screenshots
```

### Shared components

The header, mobile drawer, drawer script and footer now **exist exactly once**, in `src/components/`. Base.astro renders them on every page. A page chooses its highlighted nav item with a prop:

```astro
<Base title="Unicore Lubricants — About" active="about" bodyClass="…">
  <main>…</main>
</Base>
```

`active` is one of `home | products | tyre-sealant | applications | about | dealership | contact` (`product-detail` uses `products`). A page whose "Enquiry Now" button should go to its own anchor passes `enquiryHref` (tyre-sealant, applications, dealership, contact do). Any change to the nav or footer is now a single edit.

All `data-path` attributes are preserved.

### Pages

| Page | Purpose |
|---|---|
| `index` | Home |
| `products` | Product catalogue: six categories, three product cards each, sticky left rail with scrollspy |
| `product-detail` | Product detail template |
| `tyre-sealant` | Tyre Sealant Gel flagship page |
| `applications` | Applications & sectors |
| `about` | About Unicore |
| `dealership` | Dealership network and application |
| `contact` | Contact / enquiry |

Footer links for Safety Data Sheets, Terms of Trade and Privacy Policy stay `href="#"`: those pages do not exist yet.

## Design system

Source: `docs/DESIGN.md` and `tailwind.config.mjs`.

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

The palette is limited to these ten.

### Fonts

- **Instrument Serif** (`font-serif`): display headings, section headings, card titles and index numerals.
- **Inter** (`font-sans`): body text and UI.
- No other typefaces and no icon fonts. Arrows and the burger are text characters (▼ ☰ ×), not SVG.

### Shadows

**All box shadows are forbidden except the desktop Products dropdown.** `global.css` has `* { box-shadow: none !important; }`; `.dropdown-shadow` is the single exception and is used only on that dropdown.

## Animation

Vanilla JS and CSS only. No GSAP, no AOS, no library. It animates **opacity and transform only**.

| Effect | How |
|---|---|
| Scroll reveal | `motion.js` finds each page's content blocks and card-grid children, hides them, and reveals each once at ~15% visibility: fade in + rise 16px over 500ms, ease-out. Cards revealed in the same pass stagger 60ms each, capped at 300ms in total. Under 768px the rise is 8px (`--m-y`). |
| Hero | Pure CSS (`motion.css`). The children of the block holding the page `<h1>` (eyebrow, H1, paragraph, buttons) fade up on load, 80ms apart. No scroll trigger. |
| Card hover | `motion.js` tags card-grid children `.m-card`; CSS shifts border hairline → logo blue and background white → page-bg over 150ms. Nothing else: no lift, no scale, no shadow. |
| Links, buttons, `→` arrows | Unchanged: the existing Tailwind colour transitions and arrow translate. |
| Page transitions | Astro `ClientRouter` (view transitions), 200ms crossfade. |

Never animated: header, footer, mobile drawer, the sticky product rail (`aside` / `.sticky`), anything inside a `<form>`, the breadcrumb bar, and the tyre sealant dosage table (marked `data-no-motion`). Any element can be opted out by adding `data-no-motion`.

No loading spinners, skeletons, counters, typewriter effects or parallax.

### Turning it off

- **Automatically:** `prefers-reduced-motion: reduce` disables every reveal, animation and transition (including view transitions) and shows all content in its final state.
- **Manually, sitewide:** add `data-motion="off"` to the `<html>` tag in `src/layouts/Base.astro`. Same effect as reduced motion.
- **Removing it:** delete the `motion.css` import and the `motion.js` script from `Base.astro`. Pages render normally without them.

Because the site uses view transitions, page scripts must run on `astro:page-load` (the drawer, scrollspy and motion scripts do).

## Known issues

- `index.astro` and `applications.astro` still say "Tractor Oils" in visible copy; `products.astro` says "Agricultural Oils". Pick one name and align.
- The products left-rail note card says "drum or bucket sizes are confirmed on request": a packaging statement not confirmed by Unicore. Reword or remove.
- `applications` links "Enquiry Now" to `#trade-enquiry`; `tyre-sealant` to `#enquiry-form`; both exist on their own page.
- `tyre-sealant.astro` has one breadcrumb "Home" link with no `data-path` that is still `href="#"`.
- `tyre-sealant.astro` carries 8 ▼ characters, more than other pages. Not yet reviewed.
- The "View product →" links on product cards go to `contact.html` until product pages exist.

## Content blockers

Everything below is still `[to be confirmed by Unicore]` and awaiting client input:

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

## Next steps

Done: `products` rebuilt; header, footer and script shared; scroll and hover animation added.

1. Fill in content when the client supplies it.
2. Add the pages the footer points at (Safety Data Sheets, Terms of Trade, Privacy Policy).
3. Replace the photograph placeholders with real photography.

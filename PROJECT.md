# Unicore Lubricants — Project State

## What this is

A static marketing site for **Unicore Lubricants**, an Indian B2B lubricant manufacturer. It is an [Astro](https://astro.build) project with Tailwind CSS v3, built to plain static HTML.

The flagship product is **Tyre Sealant Gel**. It has its own page (`tyre-sealant`) and must **never** appear in the main product grid.

## Requirements

- **Node 22.23.4 or newer** (Astro 7 requires it). Pinned in `package.json` (`engines`) and `.nvmrc`; with nvm, run `nvm use`.
- npm 9.6.5 or newer.

## Run and build locally

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
  layouts/Base.astro          html shell, fonts, global CSS, view transitions, strip/header/drawer/footer
  components/Header.astro     canonical two-row fixed header   (prop: active, enquiryHref)
  components/MobileDrawer.astro  full-screen mobile drawer + its script (same props)
  components/Footer.astro     canonical four-column footer    (prop: active)
  components/AnnouncementStrip.astro  dismissible strip above the navy bar (copy lives here)
  config/announcement.js      ← the strip's dates and storage key
  assets/unicore-logo.png     logo master; Astro derives 1x/2x PNG + WebP at build
  pages/                      one file per page, each holding only that page's <main>
    index.astro  products.astro  product-detail.astro  tyre-sealant.astro
    applications.astro  about.astro  dealership.astro  contact.astro
  styles/global.css           Tailwind layers, box-shadow reset, scrollbar, strip offsets
  styles/motion.css           animation CSS (see below)
  styles/cursor.css           custom cursor CSS (see below)
  scripts/motion.js           animation JS (see below)
  scripts/cursor.js           custom cursor JS (see below)
public/favicon-32.png         favicon, cropped from the real logo mark
public/favicon-180.png        apple-touch-icon, same mark
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

## Brand assets

### Logo — kept as a raster PNG, not traced

The supplied artwork was **not traced to SVG**, deliberately. It has:

- **16,489 unique colours**, with a visible blue→navy gradient through the "Unicore" wordmark (`#065F97` at the top to roughly `#2B3371` at the bottom)
- **fine anti-aliased lines** in the sunburst inside the square mark
- **JPEG-style compression noise** across the background

Tracing that would have produced a worse mark than the original. One preparation step was applied: the artwork arrived on an **opaque `#F7F7F7` panel with no alpha channel**, which showed as a grey box on the white header bar, so the whole image was scaled by `255/247` to lift that panel to pure `#FFFFFF`. That is a linear scale, so the gradients and anti-aliasing survive intact and the artwork itself shifts by about 3%, which is invisible.

**A vector original is still needed from the client.** Until it arrives:

- The logo can only sit on white or near-white. It has no transparency, so it cannot go on the deep-navy footer, and a reversed/white version cannot be derived either (the sunburst inside the mark is already white and would disappear). **The footer therefore keeps the text wordmark**, which is the documented fallback.
- The logo's own colours (`#065F97`, `#2B3371`) are **outside the ten-colour brand palette**. They are the client's artwork, left untouched. Worth reconciling with `docs/DESIGN.md` when the vector lands.

`src/assets/unicore-logo.png` (1600×383, 4.178:1) is the master. Astro's `<Picture>` derives 1x/2x PNG and WebP and serves them with `srcset`; `width`/`height` are set explicitly so nothing shifts while loading. Rendered **28px tall on mobile, 34px on desktop**, vertically centred in the 80px main bar, with `alt="Unicore Lubricants"`.

The **"INDUSTRIAL LUBRICANTS" subtitle was dropped from the header**, because the artwork already reads "Unicore Lubricants" and keeping it would have printed "Lubricants" twice. To put it back, restore the second `<span>` in `Header.astro`.

### Favicon

`public/favicon-32.png` and `public/favicon-180.png` are cropped from the **real logo mark** (the bracket and sunburst square, left of the 72px gap in the artwork), squared on white. Linked from `Base.astro`. These replace an earlier hand-drawn SVG placeholder. Regenerate them from the vector original when it arrives.

## Announcement strip

A dismissible one-line strip above the deep-navy utility bar, on every page. White background with logo-blue text, a small brand-blue square bullet, and a × to dismiss. No festival imagery.

**The dates live in one place: `src/config/announcement.js`.** Three constants at the top of that file:

| Constant | Purpose |
|---|---|
| `WINDOW_START` | first moment the strip shows (IST, `+05:30`) |
| `WINDOW_END` | last moment it shows |
| `STORAGE_KEY` | localStorage key; **change it whenever you change the occasion**, or people who dismissed the last strip will never see the new one |

Currently set to **2026-11-05 → 2026-11-09**, i.e. three days before Diwali (8 November 2026) to the end of the day after. Confirm the Diwali date before reusing this for another year. The copy itself is the two `<span>`s in `src/components/AnnouncementStrip.astro` — a longer line on `sm` and up, a shorter one on phones.

Two things worth knowing:

- **The window is evaluated at build time, not per request.** This is a static site, so the strip only appears or disappears when the site is rebuilt. Schedule a rebuild inside the window and another after it. Outside the window nothing is emitted into the HTML at all — it is not hidden with CSS.
- **It shifts the fixed header stack.** The pages hard-code the 116px header height (`main` has `pt-[116px]`, the drawer and mobile rail sit at `top-[116px]`, the catalogue aside at `top-[136px]`). When the strip renders, `Base.astro` puts `data-strip` on `<html>` and the rules at the bottom of `global.css` add `--strip-h` to all four, so dismissing it animates the whole stack up in one step. Dismissal is stored in localStorage inside `try`/`catch`, re-applied before paint on load and again on `astro:after-swap` (a view transition replaces the `<html>` attributes, which would otherwise bring the strip back).

## Animation

Vanilla JS and CSS only. No GSAP, no AOS, no library. It animates **opacity and transform only**.

| Effect | How |
|---|---|
| Scroll reveal | `motion.js` finds each page's content blocks and card-grid children, hides them, and reveals each once at ~15% visibility: fade in + rise 16px over 500ms, ease-out. Cards revealed in the same pass stagger 60ms each, capped at 300ms in total. Under 768px the rise is 8px (`--m-y`). |
| Hero | Pure CSS (`motion.css`). The children of the block holding the page `<h1>` (eyebrow, H1, paragraph, buttons) fade up on load, 80ms apart. No scroll trigger. |
| Card hover | `motion.js` tags card-grid children `.m-card`; CSS shifts border hairline → logo blue and background white → page-bg over 150ms. Nothing else: no lift, no scale, no shadow. |
| Links, buttons, `→` arrows | Unchanged: the existing Tailwind colour transitions and arrow translate. |
| Hero accent | The italic phrase inside the page `<h1>` (`built tough`, and the equivalent on products, applications, dealership and tyre-sealant) wipes in left to right over 600ms with a `clip-path`, starting 780ms in — after the headline has faded in, plus 200ms. The H1 is in the DOM and painted from the first frame; only the accent is clipped, and only while the animation runs, so crawlers and no-JS readers get the whole headline. Pure CSS. |
| Page transitions | Astro `ClientRouter` (view transitions), 200ms crossfade. |
| Custom cursor | Desktop only. A 24px ring with a 1px logo-blue border at 35% opacity follows the pointer with a lag, and a 4px solid dot tracks it exactly. Over links, buttons, product cards and the burger the ring scales to 40px and the border goes solid; over inputs and textareas both hide so the native caret shows. rAF and transforms only. |

Never animated: header, footer, mobile drawer, the sticky product rail (`aside` / `.sticky`), anything inside a `<form>`, the breadcrumb bar, and the tyre sealant dosage table (marked `data-no-motion`). Any element can be opted out by adding `data-no-motion`. The announcement strip's collapse is the one place a layout property is transitioned, because that is what "collapses smoothly" requires.

No loading spinners, skeletons, counters, typewriter effects or parallax.

### Turning it off

- **Automatically:** `prefers-reduced-motion: reduce` disables every reveal, animation and transition (including view transitions) and shows all content in its final state.
- **Manually, sitewide:** add `data-motion="off"` to the `<html>` tag in `src/layouts/Base.astro`. Same effect as reduced motion.
- **Removing it:** delete the `motion.css` import and the `motion.js` script from `Base.astro`. Pages render normally without them.

### The custom cursor, and how to disable it

Pick whichever fits:

1. **Remove it entirely** — delete the `../styles/cursor.css` import and the `../scripts/cursor.js` import from `src/layouts/Base.astro`. That is the clean off switch.
2. **Per visitor** — it never initialises under `prefers-reduced-motion: reduce`.
3. **Sitewide with motion** — `data-motion="off"` on `<html>` disables it along with everything else.

It only starts on a device that passes `matchMedia('(hover: hover) and (pointer: fine)')`, so it never runs on touch. The native cursor is hidden *only* once the script is confirmed running (it adds `cursor-active` to `<html>`), and `cursor.css` additionally forces the native cursor back under any touch or reduced-motion media query — so a touch device, a failed script or a torn-down page always keeps a real cursor. Nothing is ever left uncursored.

Because the site uses view transitions, page scripts must run on `astro:page-load` (the drawer, scrollspy and motion scripts do).

## Known issues

- **A vector logo original is needed from the client** — see Brand assets above for what that unblocks (footer logo, palette reconciliation, a crisper favicon).
- **The navy utility bar wraps to two lines below about 400px.** Both `[to be confirmed by Unicore]` slots and the "Dealership enquiries open · PAN India" line overflow its fixed `h-9`. This is pre-existing in the canonical header and is unrelated to the announcement strip (it reproduces with the strip switched off). It will likely resolve itself once the real phone number and email replace the placeholders, so it is worth re-checking then rather than patching now.

- `index.astro` and `applications.astro` still say "Tractor Oils" in visible copy; `products.astro` says "Agricultural Oils". Pick one name and align.
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

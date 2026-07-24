---
name: wedding-site
description: Customize and maintain the Yeva & Mekhak wedding invitation site (branch y-m-23-08). Use when replacing photos, changing names/dates/venues, editing the RSVP flow, styling pages, or deploying. Covers where every piece of content lives in this template.
---

# Wedding Site — Customization Guide

Template origin: "Vanush & Armine — 27/06/2026". Target: **Yeva & Mekhak — 23/08** on branch
`y-m-23-08`. Read `CLAUDE.md` at the repo root for the tech stack; this skill is the "where do I
change X" map plus the working rules.

## Golden rules

1. **`the-day/` and `our-day/` are duplicated files, not shared.** Any change to names, dates,
   fonts, palette, RSVP, or shared sections must be applied to BOTH `the-day/index.html` and
   `our-day/index.html` (and to `index.html` for title/OG meta). Diff them after editing:
   `diff the-day/index.html our-day/index.html` — the only intended differences are the OG URL,
   the timing grid (2 vs 4 events), and the extra RSVP checkbox.
2. **No build step.** Edit HTML in place. Verify by serving locally
   (`python3 -m http.server 8080`) and loading `http://localhost:8080/the-day/` — root-absolute
   asset paths break under `file://`.
3. **Keep guest-facing text Armenian** (`lang="hy"`). English is only used for stylistic display
   headings (SAVE THE DATE, TIMING OF THE DAY).
4. **Verify visually** after layout/photo changes: render desktop (~1280px) and mobile (~390px)
   viewports via headless Chrome and check hero crop, names overlay position, and gallery crops.
   Two screenshot gotchas (both look like layout bugs but are not):
   - `chrome --headless=new --screenshot --window-size=390,...` enforces a ~500px minimum layout
     width and crops the image to 390 — right-edge content appears cut off. For mobile widths use
     CDP with `Emulation.setDeviceMetricsOverride {width: 390, mobile: true}` instead
     (launch with `--remote-debugging-port`, drive with a Node `ws` script).
   - Full-page captures show blank sections because `.reveal` elements stay `opacity: 0` until the
     IntersectionObserver fires. Before `Page.captureScreenshot`, run
     `document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'))` and wait ~1s
     (large PNGs also need a moment to decode).

## Where everything lives

### Names, date, titles (all three pages)
- `<title>`, `meta description`, all `og:*` / `twitter:*` tags — in `index.html`,
  `the-day/index.html`, `our-day/index.html`.
- Hero names overlay: `.names` block — `<span class="a">` (groom, top-left),
  `<span class="b">` (bride, bottom-right), big `&` behind them.
- SAVE THE DATE date: `.save-the-date .date`.
- Domain references `va-wedding.cc` in canonical/OG URLs — update when the new domain is chosen.

### Photos (`assets/`) — flat-lay design slots
| File | Slot |
| --- | --- |
| `ending.jpg` | Envelope liner (`.oe-liner`, triangle clip shows the photo's top band) |
| `hero.jpg` | Polaroid overlapping the invitation card (`.pol-a`, tilt −5°) |
| `opening.jpg` | Ring polaroid beside the Kindly Respond oval (`.pol-b`, tilt +4°) |
| `gallery-2.jpg` | Closing polaroid (`.pol-c`, tilt +2.5°) |
| `gallery-1.jpg`, `gallery-3.jpg` | Unused spares for extra polaroids |
| `og-preview.png`, `favicon.png` | Link preview (1200×630) / tab icon — still template art |

Replacement workflow: originals live untouched in `assets/`; generate web files with
`sips -s format jpeg -s formatOptions 80 -Z 1600 <orig> --out assets/<slot>.jpg`.

### Design notes (burgundy, exact copy of studiohov.my.canva.site/11/the-invitation)
- Element art: `assets/elements/` — user-downloaded SVGs (1–9.svg, heavy, embedded rasters) plus
  trimmed transparent PNGs made from them (`el1` doily frame, `el4` sage envelope, `el5` lace
  bow, `el6` satin bow, `el8` silver tray, `el9` pewter tray). To regenerate: render SVG in
  headless Chrome with transparent background override, canvas alpha-scan to trim (must run from
  a same-origin page or canvas taints).
- Envelope intro: `.intro` overlay; click adds `.open` to `#envelope` (flap `rotateX`, z-index
  swap after transition, card rise) and `.opening` to `#intro` (texts fade); overlay removes
  after ~1.6s, `body.locked` lifts. Note: headless Chrome only advances CSS transitions while
  frames are produced — screenshot once before clicking or the animation appears frozen.
- Hero: dance photo full-bleed; el1 doily with a dark radial `.tulle` underlay so white text
  reads; music button hidden until `assets/song.mp3` exists.
- **Trilingual (hy/en/ru)**: `data-i18n` attributes + inline `I18N` dict + fixed `.lang-switch`
  pill; persisted as `wedding-lang` in localStorage; RSVP option VALUES stay Armenian (Sheet
  consistency), labels translate; dynamic form strings via `window.__t(key)`. New text = add a
  key to all three dicts + `data-i18n` attribute.
- Cards: double borders via `border`+`outline` on `::after`; wax seal = CSS blob + radial
  gradient; swan sticker = inline SVG in `.swan-btn`.
- Countdown targets `2026-08-23T11:30:00+04:00`; plaque/swan are `<button data-scroll>` smooth
  scrollers.
- Prior designs (untracked): `index-parallax-version.html.bak`, `index-flatlay-version.html.bak`.

### Timing / venues
- `the-day/index.html`: two `.location-card` articles (church 14:15, reception 17:00).
- `our-day/index.html`: four cards (groom's house 10:30, bride's house 12:00, church, reception);
  grid is `repeat(4, ...)` on desktop.
- Each card: `.time`, `.title`, `.venue`, `.address`, and a `.map-link` (Yandex Maps short link).

### RSVP flow
- Form fields: name, guest count, attending radio, events checkboxes (our-day has one extra).
- Deadline sentence in `.rsvp .ask` ("մինչև հունիսի 10" in the template — change to the new
  deadline).
- Submission: inline script POSTs JSON (`no-cors`) to `ENDPOINT` — a Google Apps Script Web App
  URL. **For Yeva & Mekhak, deploy a fresh Apps Script** (steps in `apps-script.gs` header) on a
  new Google Sheet and replace `ENDPOINT` in BOTH pages; the template's URL writes to the
  template couple's sheet.
- `no-cors` means the response is opaque — success message shows as long as fetch resolves.

### Seating planner (`tables/`)
- Self-contained editor; guest/table state in `localStorage`, shared across devices through
  `PUT/GET /api/seating` (Cloudflare Pages Function + KV binding `tables`, optional `KV_TOKEN`).
- New deployment needs its own KV namespace binding in the Cloudflare Pages project settings,
  otherwise the API returns 501 and the page degrades to local-only.

### Fonts & palette
- `@font-face` blocks at the top of each page's `<style>`; woff2 files in `assets/fonts/`.
- Palette in `:root` custom properties (`--bg: #f7f1e6` cream, `--ink: #1f1f1f`). Design changes
  start there; hardcoded blacks (`#000` buttons/borders) are intentional accents.

## Deployment
- Cloudflare Pages serves the repo; `_redirects` sends `/` → `/the-day/`.
- Merging to the production branch of the Pages project deploys automatically. While iterating,
  push `y-m-23-08` and use the Pages preview URL.
- After deploy, re-test the OG preview (social debuggers cache aggressively) and one real RSVP
  submission end-to-end into the new Google Sheet.

## Checklist for the y-m-23-08 customization
- [ ] Names in hero + all `<title>`/OG/description tags (3 files)
- [ ] Date 27/06/2026 → 23/08/<year> everywhere (SAVE THE DATE, titles, OG)
- [ ] New photos: hero, gallery ×3, ending, og-preview, favicon
- [ ] Venues, times, addresses, Yandex map links
- [ ] RSVP deadline text + fresh Apps Script `ENDPOINT` in both pages
- [ ] Welcome + closing text reviewed
- [ ] Domain/canonical URLs updated
- [ ] Desktop + mobile visual check; `diff the-day our-day` shows only intended deltas

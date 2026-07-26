# CLAUDE.md — Wedding Invitation Website

Armenian-language wedding invitation site. Originally built as the "Vanush & Armine — 27/06/2026"
template; branch `y-m-23-08` customizes it for **Yeva & Mekhak — 23/08**.

For the step-by-step customization workflow (photos, names, dates, venues, RSVP), use the
`wedding-site` skill in `.claude/skills/wedding-site/SKILL.md`.

## Technology Stack

- **Pure static HTML/CSS/JS** — no framework, no build step, no package.json. Every page is a
  single self-contained `index.html` with all CSS in one `<style>` block and all JS in inline
  `<script>` blocks at the bottom.
- **Hosting: Cloudflare Pages** — deploys straight from the git repo. `_redirects` maps `/` →
  `/the-day/` (301). Custom domain of the template was `va-wedding.cc`.
- **Cloudflare Pages Functions** — `functions/api/seating.js` becomes `GET/PUT /api/seating`,
  backed by a KV namespace bound as `tables` (optional `KV_TOKEN` env var for bearer-token auth).
- **Google Apps Script** — `apps-script.gs` is deployed separately as a Web App; RSVP form POSTs
  JSON to it and it appends rows to a Google Sheet (`RSVPs` tab). The deployed URL is hardcoded
  as `ENDPOINT` inside the RSVP `<script>` in `the-day/index.html` and `our-day/index.html`.
- **Fonts** — self-hosted woff2 in `assets/fonts/`: Arian AMU Serif, Felix Titling (latin display
  headings), Arm Hmks Light Bold/ExtraBold (Armenian body text). Loaded via `@font-face` in each
  page's `<style>` block.

## Pages

| Path | Purpose |
| --- | --- |
| `index.html` | Root redirect to `/our-day/` (meta refresh + `location.replace`), carries OG/Twitter meta so link previews work pre-redirect |
| `our-day/index.html` | **The live invitation page (Mekhak & Yeva).** Burgundy vintage design replicating `studiohov.my.canva.site/11/the-invitation` exactly, trilingual (hy/en/ru switcher, persisted in localStorage): envelope intro (cream envelope, satin bow, wax seal) → full-screen forest-path photo hero (`assets/first.jpg`) with the square ruffle lace frame (`assets/elements/lace.png`, positioned left) + names + tap-to-play music → "We Are Getting Married" band + countdown → pewter tray photo + story + Caveat sign-off → collage over photo background (3 color polaroids, "Kindly Respond" plaque → RSVP) → silver tray + polaroids + "The Details" plaque → B&W "Our Love Story" section (photo + script title only, doily frame removed) → details + RSVP cream cards → monogram footer. Background is forest green `#023020`; the reference's swan sticker awaits the real element (hand-drawn SVG attempt was rejected as not good enough) |
| `the-day/index.html` | Template original (Vanush & Armine, 2 events) — unused, kept for reference. Delete when the couple confirms |
| `tables/index.html` | Standalone seating-plan editor (drag/resize tables, guest assignment, bride/groom sides). State in `localStorage`, synced cross-device via `/api/seating` (Cloudflare KV) with optimistic-concurrency revisions |

## Assets (`assets/`)

Web-sized JPEGs used by `our-day/` (generated with `sips -s format jpeg -s formatOptions 80 -Z <max-side>` from the originals):

- `first.jpg` (forest path, from `first-image.jpg`) — full-screen hero photo
- `hero.jpg` (fence couple) — tray-section polaroid
- `dance.jpg` (spinning hug, wide) — unused spare
- `opening.jpg` (hands with ring) — polaroid next to the Kindly Respond oval
- `ending.jpg` (meadow from behind) — envelope liner photo
- `gallery-2.jpg` (spinning hug) — closing polaroid
- `gallery-1.jpg`, `gallery-3.jpg` — currently unused spares (available for more polaroids)
- `og-preview.png`, `favicon.png` — still template art, need replacement
- Fonts in `assets/fonts/`: Arm Hmks ×2, Arian AMU Serif, Felix Titling (legacy), Pinyon Script,
  Cormorant Garamond ×2, Great Vibes (unused spare)
- Originals (13–21 MB each): `thumbnail.jpeg`, `full-sized.jpg`, `hands.jpg`, `hug.jpg`, `mistery.jpg`, `photos.jpg`, `with-flowers.jpg`
- `hero.png`, `gallery-*.png`, `ending.png` — template photos, only referenced by the unused `the-day/` page

## Design System (our-day, vintage flat-lay)

Reference: HouseofV Canva template, burgundy colorway (`studiohov.my.canva.site/11/the-invitation`,
Etsy 4536112676 / 4507108538). User-supplied element art lives in `assets/elements/` (1–9.svg
originals + trimmed transparent `elN.png` web versions): el1 lace doily frame (currently unused), el4 sage envelope
(unused), el5 lace bow (unused), el6 satin bow, el8 silver tray (details collage), el9 pewter tray (unused), `tray.png` round scalloped tray (story-section photo), plus
user-supplied `lace.png` (square ruffle frame — the hero frame).

```
--wine: #023020      page background — deep forest green (band: #0a4530, deep: #011c12)
--wine-ink: #7b2d40  burgundy accents on cream cards (seal, borders, buttons — unchanged)
--cream: #f5efe3     cards / envelope; polaroids #fdfbf4
```
(The `--wine` var names are historical — the colorway moved from burgundy to forest green on
user request; only backgrounds changed, burgundy accents stayed.)

Fonts: Pinyon Script (script headers/names), Cormorant Garamond + italic, Caveat (handwritten
sign-offs), Arian AMU Serif + Arm Hmks (Armenian). Script headers stay English by design.
**Trilingual**: `data-i18n` attributes + inline `I18N` dictionary (hy/en/ru) + fixed switcher pill;
RSVP submit VALUES stay Armenian so the Google Sheet is consistent; dynamic form strings go
through `window.__t()`. Countdown ticks to `2026-08-23T11:00:00+04:00`. Music button hidden until
`assets/song.mp3` exists. Prior designs: `our-day/index-parallax-version.html.bak`,
`our-day/index-flatlay-version.html.bak` (untracked).

## Development & Verification

No build. Serve the repo root (root-absolute paths like `/assets/...` require a server, not `file://`):

```bash
python3 -m http.server 8080   # then open http://localhost:8080/the-day/
```

The seating API only exists on Cloudflare; locally `tables/` falls back to localStorage-only.
For full local emulation: `npx wrangler pages dev .` (requires a KV binding named `tables`).

## Conventions

- Language: Armenian (`lang="hy"`); keep all guest-facing text in Armenian.
- Editing pages = editing inline CSS/JS in the page's own `index.html`; there are no shared files.
- Commit messages: one line, imperative, no Co-Authored-By.

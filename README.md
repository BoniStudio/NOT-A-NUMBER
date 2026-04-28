
# Not a Number

> Two ways of living in one body.

An interactive single-page narrative about the body, food, and the mind —
built with plain HTML, CSS and JavaScript so it can be dropped straight
onto GitHub Pages.

The piece lets the visitor toggle between two inner worlds:

- **Numbers Mode** — control, counting, anxiety. The body gets *smaller*
  but the mind gets *louder*.
- **Peace Mode** — nourishment, rest, trust. The body breathes and the
  mind softens.

Each mode has its own click counter, so a visitor can watch both inner
lives unfold side by side without one overwriting the other.

---

## Live preview

Any static web server works. The easiest way locally:

```bash
# from the project folder
python3 -m http.server 8000
# then open
open http://localhost:8000
```

Or just double-click `index.html` — because everything is static and
self-contained, it will also open directly in the browser via
`file://`. Google Fonts will load over HTTPS.

---

## Publish to GitHub Pages

1. **Push** the project to a GitHub repo (e.g. `not-a-number`).
   ```bash
   git add .
   git commit -m "feat: first pass of the interactive narrative"
   git push origin main
   ```
2. On GitHub, open the repo's **Settings → Pages**.
3. Under *Build and deployment*, choose:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `root`
4. Save. GitHub will publish the site at
   `https://<your-username>.github.io/<repo-name>/` within ~1 minute.

No build step, no bundler, no framework — the three source files go
straight to the CDN.

> Custom domain? Add a `CNAME` file with your domain, then configure
> the DNS provider's `CNAME` record to point at
> `<your-username>.github.io`.

---

## File structure

```
Not-A-NUMBER/
├── index.html     ← page skeleton: landing + main scene + ending overlay
├── style.css      ← theming, mode tokens, layout, animations, a11y
├── script.js      ← state, figure SVGs, bubble system, noise, endings
└── README.md      ← this file
```

- **`index.html`** — the entire DOM. A landing section, a main scene
  (top mode-toggle, central figure, bubble ring, meter, ending dialog).
  `<body>` has two reactive data-attributes that the CSS keys off:
  `data-stage="landing|scene"` and `data-mode="numbers|peace"`.
- **`style.css`** — two themes as CSS custom properties. Switching
  modes remaps color, font weight, border radius, spacing rhythm and
  animation tempo in a single transition. Also holds responsive
  breakpoints and `prefers-reduced-motion` fallback.
- **`script.js`** — a small state machine. It renders a different SVG
  figure for each stage of each mode (10 poses in total), positions
  bubbles on an ellipse around the figure, recycles a bubble's slot
  with a fresh thought from the pool after the visitor taps, and fires
  the ending overlay when a mode reaches its climax.

---

## Concept notes

The project is deliberately not about "thin vs. fat". It's about what
happens when a person starts measuring themselves through numbers —
kilocalories, kilograms, comparisons — and what comes back when they
stop.

Visual behaviour of the two modes:

- **Numbers** — cool greys, sharp type, tighter spacing, grain and a
  small tremor on the figure at high click counts. After 7 clicks,
  food bubbles flip into their kcal / label forms (`cake → 420 kcal`,
  `rice → carbs`). At 10 clicks the figure curls onto the floor and
  the climax line appears: *Smaller body. Louder mind.*
- **Peace** — warm cream and peach, a soft glow that breathes behind
  the figure, slower floating, serif italics. Around 8 clicks the
  figure settles cross-legged with a warm cup, and the ending poem
  appears:

  > A changing body is normal.
  > A suffering mind is not discipline.
  > Food is food.
  > You deserve peace.

Switching modes doesn't reset the other mode's progress — both inner
worlds coexist in the same body.

---

## Accessibility

- Landmark roles (`header`, `main`, `section`, `footer`) and `aria-label`
  on interactive elements.
- Keyboard: `Enter` / `Space` on the landing triggers entry; `Esc`
  closes the ending overlay.
- `prefers-reduced-motion` disables the grain texture, drift, tremor
  and reduces all transitions to a minimum.
- No audio. No autoplay.

---

## Tech notes

- Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces) (serif),
  [Inter](https://fonts.google.com/specimen/Inter) (sans) and
  [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)
  (mono), loaded from Google Fonts.
- No build tools. No package manager. No bundler.
- Tested in recent Chromium / Safari / Firefox.

---

## License

MIT — make your own version, remix it, translate it.

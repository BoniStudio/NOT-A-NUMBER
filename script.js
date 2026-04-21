/* =========================================================
 * Not a Number — script.js
 * An interactive narrative about the body, food, and the mind.
 *
 * Architecture at a glance:
 *   - STATE:   a small plain object. Each mode owns its own click counter
 *              so both inner worlds can grow independently (a person can
 *              keep their Peace progress even after peeking at Numbers).
 *   - RENDER:  pure-ish functions read STATE and paint the DOM. The figure,
 *              the bubbles, the meter and the ambient all derive from state.
 *   - INTENT:  user intents (Enter, toggleMode, tapBubble, reset) mutate
 *              state, then call render().
 * ========================================================= */

(() => {
  "use strict";

  /* ------------------------------------------------------------------
   *  DATA
   * ------------------------------------------------------------------ */

  /** Bubble sets for each mode. `variant` tweaks styling. */
  const BUBBLES = {
    numbers: [
      { id: "cake", label: "cake", numbered: "420 kcal" },
      { id: "rice", label: "rice", numbered: "carbs" },
      { id: "pasta", label: "pasta", numbered: "too much" },
      { id: "milk-tea", label: "milk tea", numbered: "regret" },
      { id: "bread", label: "bread", numbered: "avoid" },
      { id: "weight", label: "44 kg" },
      { id: "smaller", label: "smaller" },
      { id: "not-enough", label: "not enough" },
      { id: "skip", label: "skip dinner" },
      { id: "compare", label: "compare harder" },
      { id: "burn", label: "burn more" },
    ],
    peace: [
      { id: "hungry", label: "hungry" },
      { id: "warm-meal", label: "warm meal" },
      { id: "cake-friends", label: "cake with friends" },
      { id: "breakfast", label: "breakfast" },
      { id: "rest", label: "tired, rest" },
      { id: "full", label: "full now" },
      { id: "comfort", label: "craving comfort" },
      { id: "taste", label: "enjoy taste" },
    ],
  };

  /** Noise words that fly in as pressure mounts (Numbers mode). */
  const NOISE_WORDS = [
    "not enough",
    "again",
    "lower",
    "why did you eat",
    "try harder",
    "smaller",
    "less",
    "count it",
    "burn",
    "skip it",
    "one more",
  ];

  /** Gentle words that bloom in Peace mode. */
  const BREATH_WORDS = [
    "okay today",
    "enough",
    "nourished",
    "alive",
    "peaceful",
    "still worthy",
    "breathe",
    "rest",
  ];

  /** Figure thought captions keyed by mode + stage index. */
  const THOUGHTS = {
    numbers: [
      "", // stage 0 — leave quiet
      "I'll just skip the next one.",
      "Something feels off in the mirror.",
      "Smaller. Smaller. Smaller.",
      "I can't hear myself anymore.",
      "", // climax handled by ending overlay
    ],
    peace: [
      "",
      "A warm bowl. A slow breath.",
      "Taste. Not numbers.",
      "Enough, for today.",
      "", // ending handled by overlay
    ],
  };

  /** Click thresholds mapping clicks → stage index. */
  function numbersStageFromClicks(c) {
    if (c >= 10) return 5;
    if (c >= 7) return 4;
    if (c >= 5) return 3;
    if (c >= 3) return 2;
    if (c >= 1) return 1;
    return 0;
  }
  function peaceStageFromClicks(c) {
    if (c >= 7) return 4;
    if (c >= 5) return 3;
    if (c >= 3) return 2;
    if (c >= 1) return 1;
    return 0;
  }

  const NUMBERS_MAX = 10;
  const PEACE_MAX = 8;

  /* ------------------------------------------------------------------
   *  FIGURE — the body, drawn as SVG, progressing across 5–6 stages.
   *  All figures share the viewBox 0 0 200 300. Ground line near y=275.
   * ------------------------------------------------------------------ */

  const SVG_HEADER = `<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" class="fig">`;
  const SVG_FOOTER = `</svg>`;

  // tiny helper to keep authoring compact
  const g = (inner, attrs = "") => `<g ${attrs} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;

  /* ----------- NUMBERS MODE FIGURES ----------- */

  /** N0: calm, slightly tense standing figure. */
  const FIG_N0 = SVG_HEADER + g(`
    <!-- hair silhouette -->
    <path d="M78 45 Q100 18 122 45 Q128 70 120 82 L80 82 Q72 70 78 45 Z" fill="currentColor" opacity="0.08" stroke="none"/>
    <!-- head -->
    <circle cx="100" cy="55" r="22"/>
    <!-- eyes -->
    <circle cx="92" cy="55" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="108" cy="55" r="1.4" fill="currentColor" stroke="none"/>
    <!-- neutral mouth -->
    <path d="M96 68 L104 68"/>
    <!-- neck -->
    <path d="M100 77 L100 86"/>
    <!-- shoulders & torso -->
    <path d="M82 92 Q100 86 118 92 L114 180 Q100 186 86 180 Z"/>
    <!-- arms -->
    <path d="M82 96 Q74 140 78 175"/>
    <path d="M118 96 Q126 140 122 175"/>
    <!-- legs -->
    <path d="M92 182 L88 270"/>
    <path d="M108 182 L112 270"/>
    <!-- feet -->
    <path d="M82 272 L94 272"/>
    <path d="M106 272 L118 272"/>
  `) + SVG_FOOTER;

  /** N1: slightly thinner, arms crossing, faint unease. */
  const FIG_N1 = SVG_HEADER + g(`
    <path d="M80 46 Q100 20 120 46 Q124 68 118 80 L82 80 Q76 68 80 46 Z" fill="currentColor" opacity="0.06" stroke="none"/>
    <circle cx="100" cy="55" r="21"/>
    <circle cx="92" cy="55" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="108" cy="55" r="1.4" fill="currentColor" stroke="none"/>
    <!-- slightly downturned mouth -->
    <path d="M95 70 Q100 67 105 70"/>
    <path d="M100 76 L100 86"/>
    <!-- narrower torso -->
    <path d="M86 92 Q100 87 114 92 L110 180 Q100 184 90 180 Z"/>
    <!-- arms crossed over chest -->
    <path d="M86 100 Q100 130 114 112"/>
    <path d="M114 100 Q100 130 86 112"/>
    <path d="M92 182 L89 270"/>
    <path d="M108 182 L111 270"/>
    <path d="M83 272 L95 272"/>
    <path d="M105 272 L117 272"/>
  `) + SVG_FOOTER;

  /** N2: shoulders raised, hugging self, pale. */
  const FIG_N2 = SVG_HEADER + g(`
    <path d="M80 46 Q100 22 120 46 Q122 66 116 78 L84 78 Q78 66 80 46 Z" fill="currentColor" opacity="0.05" stroke="none"/>
    <circle cx="100" cy="56" r="20"/>
    <!-- eyebrows: slight slants -->
    <path d="M86 50 L93 52"/>
    <path d="M114 50 L107 52"/>
    <circle cx="93" cy="57" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="107" cy="57" r="1.3" fill="currentColor" stroke="none"/>
    <!-- frown -->
    <path d="M94 72 Q100 76 106 72"/>
    <path d="M100 76 L100 86"/>
    <!-- raised shoulders, narrower body -->
    <path d="M88 92 Q100 84 112 92 L108 178 Q100 182 92 178 Z"/>
    <!-- arms wrapped around self -->
    <path d="M88 96 Q92 130 102 128"/>
    <path d="M112 96 Q108 130 98 128"/>
    <path d="M94 180 L91 268"/>
    <path d="M106 180 L109 268"/>
    <path d="M85 270 L97 270"/>
    <path d="M103 270 L115 270"/>
  `) + SVG_FOOTER;

  /** N3: very thin, hollow eyes, head slightly bowed. */
  const FIG_N3 = SVG_HEADER + g(`
    <path d="M82 48 Q100 26 118 48 Q120 66 114 78 L86 78 Q80 66 82 48 Z" fill="currentColor" opacity="0.04" stroke="none"/>
    <circle cx="100" cy="58" r="19"/>
    <!-- tired eyes: horizontal lines -->
    <path d="M89 58 L96 58"/>
    <path d="M104 58 L111 58"/>
    <!-- mouth small and flat -->
    <path d="M97 73 L103 73"/>
    <path d="M100 78 L100 88"/>
    <!-- narrower torso -->
    <path d="M90 92 Q100 86 110 92 L106 178 Q100 180 94 178 Z"/>
    <!-- one hand near mouth -->
    <path d="M90 96 Q92 120 96 132 Q98 138 104 130"/>
    <path d="M110 96 Q112 130 104 140"/>
    <!-- legs thin -->
    <path d="M95 180 L92 268"/>
    <path d="M105 180 L108 268"/>
    <path d="M86 270 L97 270"/>
    <path d="M103 270 L114 270"/>
  `) + SVG_FOOTER;

  /** N4: tiny, clutching torso, head low. */
  const FIG_N4 = SVG_HEADER + `
  <g transform="rotate(-4 100 150)">` + g(`
    <path d="M83 50 Q100 28 117 50 Q119 68 113 78 L87 78 Q81 68 83 50 Z" fill="currentColor" opacity="0.04" stroke="none"/>
    <circle cx="100" cy="60" r="18"/>
    <!-- closed eyes -->
    <path d="M90 60 L96 60"/>
    <path d="M104 60 L110 60"/>
    <!-- thin flat mouth -->
    <path d="M96 74 L104 74"/>
    <path d="M100 79 L100 88"/>
    <!-- very narrow body -->
    <path d="M92 92 Q100 86 108 92 L104 176 Q100 178 96 176 Z"/>
    <!-- arms tight around -->
    <path d="M92 96 Q90 128 100 134 Q110 128 108 96"/>
    <!-- legs thin -->
    <path d="M96 178 L93 268"/>
    <path d="M104 178 L107 268"/>
    <path d="M87 270 L98 270"/>
    <path d="M102 270 L113 270"/>
  `) + `</g>` + SVG_FOOTER;

  /** N5: sitting on the floor, knees pulled up, head down. CLIMAX. */
  const FIG_N5 = SVG_HEADER + g(`
    <!-- ground -->
    <path d="M40 272 L160 272" opacity="0.4"/>
    <!-- curled-up silhouette -->
    <!-- back curve -->
    <path d="M70 250 Q60 170 95 135"/>
    <!-- knees -->
    <path d="M95 135 Q130 135 140 180 Q142 210 132 238"/>
    <!-- arms wrapping knees -->
    <path d="M95 165 Q120 180 138 190"/>
    <path d="M100 200 Q122 210 135 218"/>
    <!-- head tucked between knees -->
    <circle cx="104" cy="140" r="19"/>
    <!-- hair falling forward -->
    <path d="M88 135 Q95 150 112 155" opacity="0.6"/>
    <!-- feet -->
    <path d="M68 252 Q78 270 130 268 L140 268"/>
  `) + SVG_FOOTER;

  /* ----------- PEACE MODE FIGURES ----------- */

  /** P0: calm standing, a soft body. */
  const FIG_P0 = SVG_HEADER + g(`
    <path d="M76 46 Q100 16 124 46 Q130 72 122 84 L78 84 Q70 72 76 46 Z" fill="currentColor" opacity="0.14" stroke="none"/>
    <circle cx="100" cy="55" r="23"/>
    <circle cx="92" cy="55" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="108" cy="55" r="1.4" fill="currentColor" stroke="none"/>
    <path d="M96 68 Q100 70 104 68"/>
    <path d="M100 78 L100 88"/>
    <!-- fuller torso with soft fill -->
    <path d="M80 94 Q100 86 120 94 L118 184 Q100 190 82 184 Z" fill="var(--figure-fill)" stroke="currentColor"/>
    <path d="M80 98 Q72 142 78 180"/>
    <path d="M120 98 Q128 142 122 180"/>
    <path d="M90 186 L86 270"/>
    <path d="M110 186 L114 270"/>
    <path d="M80 272 L94 272"/>
    <path d="M106 272 L120 272"/>
  `) + SVG_FOOTER;

  /** P1: more open stance, small smile. */
  const FIG_P1 = SVG_HEADER + g(`
    <path d="M76 44 Q100 14 124 44 Q132 72 122 84 L78 84 Q68 72 76 44 Z" fill="currentColor" opacity="0.14" stroke="none"/>
    <circle cx="100" cy="55" r="23"/>
    <circle cx="92" cy="55" r="1.4" fill="currentColor" stroke="none"/>
    <circle cx="108" cy="55" r="1.4" fill="currentColor" stroke="none"/>
    <path d="M94 68 Q100 74 106 68"/>
    <path d="M100 78 L100 88"/>
    <path d="M78 94 Q100 86 122 94 L120 184 Q100 190 80 184 Z" fill="var(--figure-fill)" stroke="currentColor"/>
    <!-- arms slightly open -->
    <path d="M78 98 Q66 138 72 180"/>
    <path d="M122 98 Q134 138 128 180"/>
    <path d="M90 186 L85 270"/>
    <path d="M110 186 L115 270"/>
    <path d="M78 272 L93 272"/>
    <path d="M107 272 L122 272"/>
  `) + SVG_FOOTER;

  /** P2: holding a warm bowl, eating. */
  const FIG_P2 = SVG_HEADER + g(`
    <path d="M76 44 Q100 14 124 44 Q132 72 122 84 L78 84 Q68 72 76 44 Z" fill="currentColor" opacity="0.14" stroke="none"/>
    <circle cx="100" cy="56" r="23"/>
    <!-- eyes closed with content -->
    <path d="M88 56 Q92 53 96 56"/>
    <path d="M104 56 Q108 53 112 56"/>
    <path d="M94 68 Q100 74 106 68"/>
    <path d="M100 78 L100 88"/>
    <path d="M78 94 Q100 86 122 94 L120 184 Q100 190 80 184 Z" fill="var(--figure-fill)" stroke="currentColor"/>
    <!-- arms forward holding bowl -->
    <path d="M80 100 Q74 130 84 140"/>
    <path d="M120 100 Q126 130 116 140"/>
    <!-- bowl -->
    <ellipse cx="100" cy="148" rx="22" ry="6" fill="var(--figure-fill)" stroke="currentColor"/>
    <path d="M80 145 Q100 162 120 145"/>
    <!-- steam -->
    <path d="M92 138 Q90 128 94 122" opacity="0.7"/>
    <path d="M100 138 Q98 125 102 118" opacity="0.7"/>
    <path d="M108 138 Q110 128 106 122" opacity="0.7"/>
    <path d="M90 186 L86 270"/>
    <path d="M110 186 L114 270"/>
    <path d="M80 272 L94 272"/>
    <path d="M106 272 L120 272"/>
  `) + SVG_FOOTER;

  /** P3: resting, eyes closed, peaceful. */
  const FIG_P3 = SVG_HEADER + `<g transform="rotate(3 100 150)">` + g(`
    <path d="M76 44 Q100 14 124 44 Q132 72 122 84 L78 84 Q68 72 76 44 Z" fill="currentColor" opacity="0.14" stroke="none"/>
    <circle cx="100" cy="55" r="23"/>
    <!-- closed, restful eyes -->
    <path d="M88 56 Q92 60 96 56"/>
    <path d="M104 56 Q108 60 112 56"/>
    <path d="M96 70 Q100 72 104 70"/>
    <path d="M100 78 L100 88"/>
    <path d="M80 94 Q100 86 120 94 L118 184 Q100 190 82 184 Z" fill="var(--figure-fill)" stroke="currentColor"/>
    <path d="M80 100 Q68 146 82 178"/>
    <path d="M120 100 Q132 146 118 178"/>
    <path d="M92 186 L88 270"/>
    <path d="M108 186 L112 270"/>
    <path d="M82 272 L96 272"/>
    <path d="M104 272 L118 272"/>
  `) + `</g>` + SVG_FOOTER;

  /** P4: sitting cross-legged, holding a warm cup — ending. */
  const FIG_P4 = SVG_HEADER + g(`
    <!-- sparkles -->
    <path d="M46 120 L50 116 L54 120 L50 124 Z" fill="currentColor" opacity="0.6" stroke="none"/>
    <path d="M146 100 L150 96 L154 100 L150 104 Z" fill="currentColor" opacity="0.6" stroke="none"/>
    <path d="M160 180 L164 176 L168 180 L164 184 Z" fill="currentColor" opacity="0.5" stroke="none"/>
    <path d="M30 180 L34 176 L38 180 L34 184 Z" fill="currentColor" opacity="0.5" stroke="none"/>

    <!-- ground softly -->
    <path d="M40 262 Q100 268 160 262" opacity="0.35"/>

    <!-- crossed legs silhouette -->
    <path d="M58 258 Q100 220 142 258 Q144 266 140 268 L60 268 Q56 266 58 258 Z" fill="var(--figure-fill)" stroke="currentColor"/>
    <!-- inner fold suggesting cross-legged -->
    <path d="M85 245 Q100 235 115 245" opacity="0.7"/>

    <!-- torso -->
    <path d="M82 150 Q100 140 118 150 L120 222 Q100 232 80 222 Z" fill="var(--figure-fill)" stroke="currentColor"/>
    <!-- shoulders to arms around cup -->
    <path d="M82 156 Q74 184 88 198"/>
    <path d="M118 156 Q126 184 112 198"/>

    <!-- cup -->
    <rect x="90" y="190" width="20" height="18" rx="3" fill="var(--figure-fill)" stroke="currentColor"/>
    <path d="M110 194 Q118 194 118 202 Q118 208 110 208"/>
    <!-- steam -->
    <path d="M94 186 Q92 176 96 170" opacity="0.7"/>
    <path d="M100 186 Q98 172 102 166" opacity="0.7"/>
    <path d="M106 186 Q108 176 104 170" opacity="0.7"/>

    <!-- head & hair -->
    <path d="M76 90 Q100 58 124 90 Q132 118 122 130 L78 130 Q68 118 76 90 Z" fill="currentColor" opacity="0.14" stroke="none"/>
    <circle cx="100" cy="105" r="23"/>
    <!-- peaceful closed eyes, small smile -->
    <path d="M88 105 Q92 102 96 105"/>
    <path d="M104 105 Q108 102 112 105"/>
    <path d="M94 118 Q100 124 106 118"/>
    <path d="M100 128 L100 142"/>
  `) + SVG_FOOTER;

  const FIGURES = {
    numbers: [FIG_N0, FIG_N1, FIG_N2, FIG_N3, FIG_N4, FIG_N5],
    peace: [FIG_P0, FIG_P1, FIG_P2, FIG_P3, FIG_P4],
  };

  /* ------------------------------------------------------------------
   *  STATE
   * ------------------------------------------------------------------ */

  const STATE = {
    stage: "landing", // "landing" | "scene"
    mode: "numbers", // "numbers" | "peace"
    clicks: { numbers: 0, peace: 0 },
    reachedEnding: { numbers: false, peace: false },
    // rolling pointer into the bubble pool per mode — used to recycle
    // a new thought into any slot whose bubble was just consumed.
    bubbleCursor: { numbers: 0, peace: 0 },
  };

  /* ------------------------------------------------------------------
   *  DOM LOOKUPS
   * ------------------------------------------------------------------ */

  const $ = (sel) => document.querySelector(sel);

  const el = {
    body: document.body,
    enter: $("#enterBtn"),
    reset: $("#resetBtn"),
    scene: $("#scene"),
    landing: $("#landing"),
    figure: $("#figure"),
    thought: $("#figureThought"),
    bubbles: $("#bubbles"),
    noise: $("#noiseLayer"),
    toggles: document.querySelectorAll(".toggle__btn"),
    meterLabel: $("#meterLabel"),
    meterValue: $("#meterValue"),
    meterMax: $("#meterMax"),
    bottomHint: $("#bottomHint"),
    ending: $("#ending"),
    endingLines: document.querySelectorAll(".ending__line"),
    endingClose: $("#endingClose"),
    cursorDot: $("#cursorDot"),
  };

  /* ------------------------------------------------------------------
   *  INTENTS
   * ------------------------------------------------------------------ */

  function enterScene() {
    if (STATE.stage === "scene") return;
    STATE.stage = "scene";
    el.body.dataset.stage = "scene";
    el.scene.setAttribute("aria-hidden", "false");
    el.landing.setAttribute("aria-hidden", "true");
    // Paint the scene AFTER the transition has room to breathe.
    // We render immediately so swap lands during the fade.
    renderAll();
  }

  /**
   * Mode switching:
   * We deliberately DO NOT reset counters when switching modes. Each inner
   * world keeps its own state. Users can flip back to see what they've been
   * building in either direction. This is core to the thesis: the two lives
   * coexist in one body.
   */
  function setMode(mode) {
    if (mode === STATE.mode) return;
    STATE.mode = mode;
    el.body.dataset.mode = mode;
    // if an ending overlay is showing, close it when switching
    hideEnding();
    renderAll();
  }

  function tapBubble(bubbleEl) {
    const mode = STATE.mode;
    const cap = mode === "numbers" ? NUMBERS_MAX : PEACE_MAX;
    if (STATE.clicks[mode] >= cap) {
      return;
    }
    const prevNumberize = mode === "numbers" && STATE.clicks.numbers >= 7;
    STATE.clicks[mode] += 1;
    const nowNumberize = mode === "numbers" && STATE.clicks.numbers >= 7;

    // Crossing the 7-click threshold: every food bubble in the ring
    // flips into its numbered form. Food is no longer food, only kcal.
    if (!prevNumberize && nowNumberize) {
      numberizeExistingBubbles();
    }

    // Pop only this bubble. Once its fade-out completes, recycle a fresh
    // thought from the pool into the same slot so the ring of bubbles
    // stays populated until the climax. This keeps the scene breathing.
    bubbleEl.classList.add("is-popped");
    const slot = bubbleEl.parentElement;

    setTimeout(() => {
      if (!slot || !slot.parentElement) return;
      if (STATE.clicks[mode] < cap) {
        const pool = BUBBLES[mode];
        const idx = STATE.bubbleCursor[mode] % pool.length;
        STATE.bubbleCursor[mode] += 1;
        const next = pool[idx];
        const fresh = buildBubbleNode(next, mode);
        // inherit the float deltas from the old bubble so the floating
        // rhythm feels consistent within a slot
        fresh.style.setProperty(
          "--float-dx",
          bubbleEl.style.getPropertyValue("--float-dx") || "0px",
        );
        fresh.style.setProperty(
          "--float-dy",
          bubbleEl.style.getPropertyValue("--float-dy") || "0px",
        );
        fresh.style.setProperty(
          "--float-dur",
          bubbleEl.style.getPropertyValue("--float-dur") || "6s",
        );
        fresh.style.animationDelay = bubbleEl.style.animationDelay || "0s";
        slot.replaceChild(fresh, bubbleEl);
        requestAnimationFrame(() => {
          setTimeout(() => fresh.classList.add("is-in"), 60);
        });
      } else {
        // at cap — retire the slot
        slot.parentElement.removeChild(slot);
      }
    }, 480);

    renderToggle();
    renderFigure();
    renderThought();
    renderMeter();
    renderIntensity();

    spawnNoiseWord(bubbleEl);
    checkEnding();
  }

  function resetAll() {
    STATE.clicks.numbers = 0;
    STATE.clicks.peace = 0;
    STATE.reachedEnding.numbers = false;
    STATE.reachedEnding.peace = false;
    hideEnding();
    renderAll();
  }

  /* ------------------------------------------------------------------
   *  RENDER
   * ------------------------------------------------------------------ */

  function renderAll() {
    renderToggle();
    renderFigure();
    renderThought();
    renderBubbles();
    renderMeter();
    renderIntensity();
  }

  function renderToggle() {
    el.toggles.forEach((btn) => {
      const active = btn.dataset.mode === STATE.mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function renderFigure() {
    const mode = STATE.mode;
    const clicks = STATE.clicks[mode];
    const stageIdx =
      mode === "numbers"
        ? numbersStageFromClicks(clicks)
        : peaceStageFromClicks(clicks);
    const svg = FIGURES[mode][stageIdx] || FIGURES[mode][0];
    // Only swap markup if stage actually changed, to avoid re-creating SVG
    // on every render (which would kill transitions).
    if (el.figure.dataset.stageIndex !== String(stageIdx) ||
        el.figure.dataset.stageMode !== mode) {
      el.figure.innerHTML = svg;
      el.figure.dataset.stageIndex = String(stageIdx);
      el.figure.dataset.stageMode = mode;
    }
  }

  function renderThought() {
    const mode = STATE.mode;
    const clicks = STATE.clicks[mode];
    const stageIdx =
      mode === "numbers"
        ? numbersStageFromClicks(clicks)
        : peaceStageFromClicks(clicks);
    const text = (THOUGHTS[mode] && THOUGHTS[mode][stageIdx]) || "";
    if (text) {
      el.thought.textContent = text;
      el.thought.classList.add("is-visible");
    } else {
      el.thought.classList.remove("is-visible");
    }
  }

  function renderMeter() {
    const mode = STATE.mode;
    const clicks = STATE.clicks[mode];
    const max = mode === "numbers" ? NUMBERS_MAX : PEACE_MAX;
    el.meterLabel.textContent = mode === "numbers" ? "Numbers" : "Peace";
    el.meterValue.textContent = String(clicks);
    el.meterMax.textContent = String(max);
    el.bottomHint.textContent =
      mode === "numbers"
        ? clicks >= NUMBERS_MAX
          ? "smaller body. louder mind."
          : "tap the noise"
        : clicks >= PEACE_MAX - 1
          ? "a slower breath"
          : "tap to nourish";
  }

  function renderIntensity() {
    // used by CSS for tremor/grain amount etc.
    const mode = STATE.mode;
    const clicks = STATE.clicks[mode];
    let intensity = 0;
    if (mode === "numbers") {
      if (clicks >= 9) intensity = 4;
      else if (clicks >= 6) intensity = 3;
      else if (clicks >= 3) intensity = 2;
      else if (clicks >= 1) intensity = 1;
    } else {
      // peace intensity mostly drives softness, we set for symmetry
      if (clicks >= 5) intensity = 2;
      else if (clicks >= 2) intensity = 1;
    }
    el.body.dataset.intensity = String(intensity);
  }

  /* ------------------------------------------------------------------
   *  BUBBLES
   * ------------------------------------------------------------------ */

  /** Flip currently-visible food bubbles into their numbered form. */
  function numberizeExistingBubbles() {
    const nodes = el.bubbles.querySelectorAll(".bubble:not(.is-popped)");
    nodes.forEach((n) => {
      const id = n.getAttribute("data-bubble-id");
      const data = BUBBLES.numbers.find((b) => b.id === id);
      if (data && data.numbered) {
        // fade-swap the label for a moment of visual disruption
        n.style.opacity = "0";
        setTimeout(() => {
          n.textContent = data.numbered;
          n.classList.add("is-number");
          n.style.opacity = "";
        }, 220);
      }
    });
  }

  /** Build a single bubble <button>. */
  function buildBubbleNode(b, mode) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "bubble";
    node.setAttribute("data-bubble-id", b.id);
    node.setAttribute("aria-label", `bubble: ${b.label}`);

    // Numbers mode: once clicks ≥ 7, food bubbles render in their
    // numbered form — cake becomes "420 kcal", rice becomes "carbs", etc.
    const numberize = mode === "numbers" && STATE.clicks.numbers >= 7;
    let label = b.label;
    if (numberize && b.numbered) {
      label = b.numbered;
      node.classList.add("is-number");
    }
    node.textContent = label;
    node.addEventListener("click", () => tapBubble(node));
    return node;
  }

  /**
   * Render the initial bubble ring for the current mode. We position
   * bubbles on an ellipse around the figure using deterministic angles,
   * lightly jittered so the layout feels organic rather than mechanical.
   *
   * After this initial render, tapBubble recycles individual slots with
   * fresh thoughts from the pool — we don't re-render the whole ring on
   * every click, because that would interrupt floating animations and
   * make the scene feel nervous in the wrong way.
   */
  function renderBubbles() {
    el.bubbles.innerHTML = "";
    const mode = STATE.mode;
    const pool = BUBBLES[mode];

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const small = vw < 640;
    // A ring of ~6 on small screens, ~8 on larger screens. Keeps the
    // scene from feeling cluttered around the figure.
    const count = small ? 6 : Math.min(pool.length, 8);

    // Start the recycle cursor past the initial slice so new bubbles
    // introduce fresh words.
    STATE.bubbleCursor[mode] = count;

    for (let i = 0; i < count; i++) {
      const b = pool[i % pool.length];

      const slot = document.createElement("div");
      slot.className = "bubble-slot";

      const node = buildBubbleNode(b, mode);

      // position on an ellipse around the figure
      const angle = (i / count) * Math.PI * 2 + (mode === "peace" ? 0.3 : 0);
      const jr = 0.92 + ((i * 37) % 17) / 100;
      const rx = Math.min(vw * 0.38, 420) * jr;
      const ry = Math.min(vh * 0.32, 320) * jr;

      const cx = 50 + (Math.cos(angle) * rx) / vw * 100;
      const cy = 50 + (Math.sin(angle) * ry) / vh * 100;

      slot.style.setProperty("--x", cx + "%");
      slot.style.setProperty("--y", cy + "%");

      const dx = ((i * 53) % 13) - 6;
      const dy = ((i * 91) % 15) - 7;
      node.style.setProperty("--float-dx", dx + "px");
      node.style.setProperty("--float-dy", dy + "px");
      node.style.setProperty("--float-dur", 6 + (i % 5) + "s");
      node.style.animationDelay = -1 * (i * 0.37) + "s";

      slot.appendChild(node);
      el.bubbles.appendChild(slot);

      requestAnimationFrame(() => {
        setTimeout(() => node.classList.add("is-in"), 40 + i * 50);
      });
    }
  }

  /* ------------------------------------------------------------------
   *  NOISE & BREATH
   * ------------------------------------------------------------------ */

  /**
   * Spawn a word from the current mode's word pool. Numbers words streak
   * horizontally across the screen (thought noise); Peace words rise
   * gently from near the figure.
   */
  function spawnNoiseWord(originEl) {
    const mode = STATE.mode;
    const clicks = STATE.clicks[mode];
    const pool = mode === "numbers" ? NOISE_WORDS : BREATH_WORDS;
    // Numbers: spawn more as clicks climb.
    const bursts = mode === "numbers" ? Math.min(1 + Math.floor(clicks / 2), 4) : 1;

    for (let k = 0; k < bursts; k++) {
      const word = pool[Math.floor(Math.random() * pool.length)];
      const node = document.createElement("span");
      node.className = "noise__word";
      node.textContent = word;

      if (mode === "numbers") {
        const top = 15 + Math.random() * 75; // %
        const left = 10 + Math.random() * 75; // %
        const fontSize = 11 + Math.random() * 8;
        const dur = 1.8 + Math.random() * 1.4;
        node.style.top = top + "%";
        node.style.left = left + "%";
        node.style.fontSize = fontSize + "px";
        node.style.animationDuration = dur + "s";
      } else {
        // peace: rise from around the figure center
        const left = 35 + Math.random() * 30;
        const top = 40 + Math.random() * 30;
        node.style.left = left + "%";
        node.style.top = top + "%";
        node.style.fontSize = 14 + Math.random() * 8 + "px";
      }

      el.noise.appendChild(node);
      // cleanup
      setTimeout(() => node.remove(), 6000);
    }
  }

  /* ------------------------------------------------------------------
   *  ENDING
   * ------------------------------------------------------------------ */

  function checkEnding() {
    const mode = STATE.mode;
    const clicks = STATE.clicks[mode];
    if (mode === "numbers" && clicks >= NUMBERS_MAX && !STATE.reachedEnding.numbers) {
      STATE.reachedEnding.numbers = true;
      setTimeout(() => showEnding("numbers"), 700);
    } else if (mode === "peace" && clicks >= PEACE_MAX && !STATE.reachedEnding.peace) {
      STATE.reachedEnding.peace = true;
      setTimeout(() => showEnding("peace"), 700);
    }
  }

  function showEnding(mode) {
    if (mode === "numbers") {
      el.endingLines[0].innerHTML = "Smaller body.";
      el.endingLines[1].innerHTML = "<em>Louder</em> mind.";
      el.endingLines[2].innerHTML = "";
      el.endingLines[3].innerHTML = "";
    } else {
      el.endingLines[0].textContent = "A changing body is normal.";
      el.endingLines[1].textContent = "A suffering mind is not discipline.";
      el.endingLines[2].textContent = "Food is food.";
      el.endingLines[3].textContent = "You deserve peace.";
    }
    el.ending.classList.add("is-visible");
    el.ending.setAttribute("aria-hidden", "false");
  }

  function hideEnding() {
    el.ending.classList.remove("is-visible");
    el.ending.setAttribute("aria-hidden", "true");
  }

  /* ------------------------------------------------------------------
   *  WIRING
   * ------------------------------------------------------------------ */

  function bind() {
    el.enter.addEventListener("click", enterScene);
    // let Enter key from keyboard focus do the same
    document.addEventListener("keydown", (e) => {
      if (STATE.stage === "landing" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        enterScene();
      }
      if (e.key === "Escape") {
        hideEnding();
      }
    });

    el.toggles.forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    el.reset.addEventListener("click", resetAll);
    el.endingClose.addEventListener("click", hideEnding);

    // Desktop cursor companion
    window.addEventListener("pointermove", (e) => {
      el.cursorDot.style.transform =
        `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    });

    // Re-layout bubbles on resize (debounced)
    let t;
    window.addEventListener("resize", () => {
      if (STATE.stage !== "scene") return;
      clearTimeout(t);
      t = setTimeout(renderBubbles, 180);
    });
  }

  /* ------------------------------------------------------------------
   *  INIT
   * ------------------------------------------------------------------ */

  function init() {
    bind();
    // Preload figure at stage 0 so the scene has content the moment we enter
    el.figure.innerHTML = FIGURES.numbers[0];
    el.figure.dataset.stageIndex = "0";
    el.figure.dataset.stageMode = "numbers";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

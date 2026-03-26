# Embedding

## Requirements

1. **Parent exists** — `mount` inserts a wrapper before your node; the node must have a `parentNode`.
2. **Transparent overlay** — The canvas uses **alpha**; do not set a background on the injected wrapper (the library does not add one). Your page background shows through.
3. **Stacking** — Canvas defaults to `z-index: -1` behind the text; use `canvasZIndex` / `setCanvasZIndex` to change. Give siblings `position: relative; z-index` if they must sit above the flame art.
4. **Pointer events** — Wrapper, target element, and canvas use `pointer-events: none` so clicks reach siblings (the headline’s line box can be large). The canvas does not block interaction.

## npm (bundler or `type="module"`)

```ts
import { mount, autoInit } from '@codebystella/flame-text'
```

The package resolves to `dist/flame-text.js` (ESM).

## Public URLs (GitHub Pages + npm CDN)

**GitHub Pages** (built from `main`): replace `OWNER` and `REPO` with your fork. This repo uses `https://codebystella.github.io/flame-text/`.

- IIFE: `https://OWNER.github.io/REPO/flame-text.iife.js` — global **`FlameText`** (`mount`, `autoInit`).
- ESM: `https://OWNER.github.io/REPO/flame-text.js` — use in `import` from a `type="module"` script.

**jsDelivr / unpkg** (after the package is published to npm): same files under `dist/`, e.g.

`https://cdn.jsdelivr.net/npm/@codebystella/flame-text@0.1.0/dist/flame-text.iife.js`

Pin a version for stability; `@latest` tracks the newest publish.

## ESM (local build)

Point at `dist/flame-text.js` (or the package export) when developing from a clone.

## Script tag (IIFE)

Build produces `dist/flame-text.iife.js`. Global **`FlameText`** exposes `mount` and `autoInit`.

### Local or self-hosted

```html
<div id="title">BURN</div>
<script src="/vendor/flame-text.iife.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    FlameText.mount('#title', { temperature: 0.6, ignition: true })
  })
</script>
```

### GitHub Pages / CDN

```html
<div id="title">BURN</div>
<script src="https://codebystella.github.io/flame-text/flame-text.iife.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    FlameText.mount('#title', { temperature: 0.6, ignition: true })
  })
</script>
```

## Declarative hook

Add `data-flame-text` and call `FlameText.autoInit()` once the DOM is ready.

```html
<h1 data-flame-text>OIL</h1>
<script src="https://codebystella.github.io/flame-text/flame-text.iife.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    FlameText.autoInit()
  })
</script>
```

## Fonts

For best path fidelity, pass **`fontUrl`** to a file your server serves with **CORS** if cross-origin. The library also tries to discover `@font-face` URLs from stylesheets for the computed `font-family`. See [troubleshooting.md](troubleshooting.md).

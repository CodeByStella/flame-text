# Embedding

## Requirements

1. **Parent exists** — `mount` inserts a wrapper before your node; the node must have a `parentNode`.
2. **Transparent overlay** — The canvas uses **alpha**; do not set a background on the injected wrapper (the library does not add one). Your page background shows through.
3. **Stacking** — Canvas is `position: absolute` with `z-index: 1` inside a `position: relative` wrapper. Raise z-index on siblings if something covers the flame.
4. **Pointer events** — Overlay has `pointer-events: none` so clicks hit content below.

## ESM (bundler / `type="module"`)

Point at `dist/flame-text.js` (or the package export).

## Script tag (IIFE)

Build produces `dist/flame-text.iife.js`. Global **`FlameText`** exposes `mount` and `autoInit`.

```html
<div id="title">BURN</div>
<script src="/vendor/flame-text.iife.js"></script>
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
<script src="/vendor/flame-text.iife.js"></script>
<script>FlameText.autoInit()</script>
```

## Fonts

For best path fidelity, pass **`fontUrl`** to a file your server serves with **CORS** if cross-origin. The library also tries to discover `@font-face` URLs from stylesheets for the computed `font-family`. See [troubleshooting.md](troubleshooting.md).

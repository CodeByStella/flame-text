# API reference

## `mount(target, options?)`

- **target** `string | Element` — CSS selector or element. Must be an `HTMLElement` with a parent node.
- Returns **`FlameTextHandle`**:
  - **`destroy()`** — Remove wrapper, canvas, listeners, animation.
  - **`setTemperature(t: number)`** — Clamp to `[0, 1]`.
  - **`setIntensity(n: number)`** — Clamp to `[0, 2]`.
  - **`setCanvasZIndex(z: number \| string)`** — Set the flame canvas CSS `z-index` at runtime.

## Options (`FlameTextOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `flamePadding` | `FlamePadding` | — | Extra **draw** area around the glyph (canvas is larger and shifted with negative `left`/`top`). The mounted wrapper keeps the **text’s normal layout size**; flames may extend outside (ensure ancestors use `overflow: visible` if you must not clip). Defaults: **top** ≈ max(1.55em, 68% of text height, 88px); **x** ≈ max(0.62em, 14% of text height, 32px); **bottom** ≈ max(0.58em, 14% of text height, 28px). |
| `fontUrl` | `string` | — | Direct URL to a font file (woff/woff2/ttf/otf). **Recommended** for reliable outlines + CORS. |
| `temperature` | `number` | `0.65` | With `intensity`, scales how many specks spawn per frame (0 = fewer, 1 = more). |
| `intensity` | `number` | `1` | Spawn budget and draw alpha; base rate matches a ~50/frame demo scaled to the canvas. |
| `particleCount` | `number` | `1000` | Clamped `500…5000`. Max simultaneous specks (pool size); each is one radial gradient + `lighter` fill. |
| `wind` | `number` | `0` | Accepted for API stability; **not applied** (particles use the fixed demo integrator). |
| `respectReducedMotion` | `boolean` | `true` | If `true` and `prefers-reduced-motion: reduce`, show a static glow instead of particles. |
| `ignition` | `boolean \| IgnitionOptions` | `false` | Intro: spread along horizontal span + subtle wet sheen. |
| `textStroke` | `boolean` | `true` | Stroke uses `palette.textStroke` (default `#FEFFF4`); width still scales with `temperature`. `paint-order: stroke fill`. Set `false` to skip stroke only. |
| `palette` | `FlamePaletteInput` | — | Optional `{ textStroke, textFill, flame }`. `textFill` / `textStroke` set the glyph colors; `flame` is **five** hex strings in order `#FFFAF4` → `#FFC98A` → `#E04A28` → `#9A1410` → `#4A0A08` (hot core through cool red ember; each speck uses a radial gradient so the center reads brighter and the rim redder; see `buildFlameRadialStops` in source). |
| `canvasZIndex` | `number \| string` | `-1` | Stacking order of the flame canvas. Default keeps fire **behind** the text; raise to paint above siblings. If `≥ 0`, give the text `position: relative; z-index: 1` (or higher) so glyphs stay above the fire. |

### `FlamePadding`

| Field | Type | Description |
|-------|------|-------------|
| `top` | `number` | Extra space **above** the text (px). |
| `x` | `number` | Horizontal inset on **each** side (px). |
| `bottom` | `number` | Extra space **below** the text (px). |

### `IgnitionOptions`

| Field | Type | Default |
|-------|------|---------|
| `durationMs` | `number` | `2400` |
| `easing` | `'linear' \| 'ease-in-out'` | `'ease-in-out'` |

## `autoInit()`

Queries `document.querySelectorAll('[data-flame-text]')` and calls `mount(el, {})` on each. Call after DOM ready (e.g. `DOMContentLoaded`).

## Types

Published in `dist/*.d.ts`; import from package root:

```ts
import type { FlameTextOptions, FlameTextHandle } from '@codebystella/flame-text'
```

# API reference

## `mount(target, options?)`

- **target** `string | Element` — CSS selector or element. Must be an `HTMLElement` with a parent node.
- Returns **`FlameTextHandle`**:
  - **`destroy()`** — Remove wrapper, canvas, listeners, animation.
  - **`setTemperature(t: number)`** — Clamp to `[0, 1]`.
  - **`setIntensity(n: number)`** — Clamp to `[0, 2]`.

## Options (`FlameTextOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `flamePadding` | `FlamePadding` | — | Extra canvas area beyond the text box so rising flames are not clipped. Defaults: generous **top** (≈ `1.2em` or **55%** of text height, min 56px), **x** ≈ `0.45em` (min 24px), **bottom** ≈ `0.45em` (min 20px). |
| `fontUrl` | `string` | — | Direct URL to a font file (woff/woff2/ttf/otf). **Recommended** for reliable outlines + CORS. |
| `temperature` | `number` | `0.65` | Heat: cooler = slower, redder; hotter = faster, brighter core. |
| `intensity` | `number` | `1` | Overall spawn/render strength. |
| `particleCount` | `number` | `320` | Clamped roughly `80…800`. |
| `wind` | `number` | `0` | Horizontal bias `-1…1`. |
| `respectReducedMotion` | `boolean` | `true` | If `true` and `prefers-reduced-motion: reduce`, show a static glow instead of particles. |
| `ignition` | `boolean \| IgnitionOptions` | `false` | Intro: spread along horizontal span + subtle wet sheen. |

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

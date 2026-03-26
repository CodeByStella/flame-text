# Fonts & troubleshooting

## Vector paths vs canvas fallback

- **OpenType path** — Used when a font file is loaded (`fontUrl` or a discovered `@font-face` URL). Outlines are rasterized to a mask; particles spawn from a **dense interior sample** of every opaque pixel (full stroke coverage), with extra weight where the glyph is thickest (Manhattan distance from the outline), so fire follows the text body rather than a few edge lines.
- **Canvas `fillText` fallback** — If no font file is available (e.g. system UI fonts), text is drawn with the computed CSS font and the same mask pipeline runs. Shapes follow **rendered pixels**, not Bézier data.

## CORS

Fetching a font from another origin requires valid **CORS** headers on the font response. If fetch fails, the library falls back to canvas text.

## Layout vs flame extent

- The **wrapper** sizes like your text node (no extra padding in flow). The **canvas** is larger and positioned with negative `left` / `top`, so the plume can spill outside the text box without shifting siblings.
- The wrapper, **text node**, and canvas all use **`pointer-events: none`** so neither the oversized canvas nor the headline’s **full line box** (which can be huge at large `font-size`) blocks clicks on siblings below. Restore prior behavior on `destroy()` if you had set `pointer-events` on the target.
- If the top or sides of the flame **clip**, a parent likely has **`overflow: hidden`** (or `clip`). Use **`overflow: visible`** on ancestors that wrap the effect, or add horizontal padding/margin in your layout instead of hiding overflow.

## Nothing draws

- **Zero size** — Target must have non-zero `offsetWidth` / `offsetHeight`.
- **Empty text** — `textContent` empty → no mask.
- **Font not loaded** — Wait for webfonts (`document.fonts.ready` is used internally; still ensure `@font` faces load).

## Opaque rectangle over the text

- Ensure you did not set a **background** on a parent that only exists to cover the effect.
- The canvas should use **alpha** (default 2D). If you fork the code, never `fillRect` an opaque color each frame.

## Flame particles (look and motion)

- Motion matches a minimal canvas fire sketch: random `vx`/`vy`, radius **`s`** shrinks by a fixed amount each frame, **`vy -= 0.2`** (scaled), horizontal pull toward the spawn **`x`**, **`rgba(200,188,2,1)`** core and random rim `rgb` fading to transparent, **`lighter`** blend.
- Tune how many specks appear with **`intensity`**, **`temperature`**, and the max pool **`particleCount`**.

## Performance

- The default pool is **1000** particles; each live speck is a **radial gradient + `lighter` blend** every frame, which adds up on integrated GPUs.
- Lower **`particleCount`** (e.g. `600`–`800`) or **`intensity`** if the page or whole system feels sluggish.
- Prefer one or two mounted instances per viewport. For a denser look on a fast machine, raise **`particleCount`** (e.g. `1800`–`2400`) instead of many separate mounts.

## Reduced motion

With `respectReducedMotion: true` (default), users with `prefers-reduced-motion: reduce` get a static glow instead of the particle loop.

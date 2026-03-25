# Fonts & troubleshooting

## Vector paths vs canvas fallback

- **OpenType path** — Used when a font file is loaded (`fontUrl` or a discovered `@font-face` URL). Outlines are rasterized to a mask; emission uses the **top edge** of the glyph silhouette.
- **Canvas `fillText` fallback** — If no font file is available (e.g. system UI fonts), text is drawn with the computed CSS font and the same mask pipeline runs. Shapes follow **rendered pixels**, not Bézier data.

## CORS

Fetching a font from another origin requires valid **CORS** headers on the font response. If fetch fails, the library falls back to canvas text.

## Nothing draws

- **Zero size** — Target must have non-zero `offsetWidth` / `offsetHeight`.
- **Empty text** — `textContent` empty → no mask.
- **Font not loaded** — Wait for webfonts (`document.fonts.ready` is used internally; still ensure `@font` faces load).

## Opaque rectangle over the text

- Ensure you did not set a **background** on a parent that only exists to cover the effect.
- The canvas should use **alpha** (default 2D). If you fork the code, never `fillRect` an opaque color each frame.

## Performance

- Lower **`particleCount`** (e.g. `200`).
- Lower **`intensity`**.
- Prefer one or two mounted instances per viewport.

## Reduced motion

With `respectReducedMotion: true` (default), users with `prefers-reduced-motion: reduce` get a static glow instead of the particle loop.

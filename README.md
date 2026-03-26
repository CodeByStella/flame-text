# FlameText

Embeddable **oil-on-fire** text: transparent canvas overlay, glyph-aware emission (OpenType when a font URL is available, otherwise canvas raster), particle plume, **temperature** and **intensity** controls, optional **ignition** intro.

## Install (npm / bundler)

```bash
npm install @codebystella/flame-text
```

```ts
import { mount } from '@codebystella/flame-text'
```

## CDN / script embed

After each push to `main`, [GitHub Actions](.github/workflows/pages.yml) publishes `dist/` to **GitHub Pages**. Use your real owner and repo name in the URL (this project: `https://codebystella.github.io/flame-text/`).

| Method | URL pattern |
|--------|-------------|
| **GitHub Pages (IIFE)** | `https://OWNER.github.io/REPO/flame-text.iife.js` |
| **GitHub Pages (ESM)** | `https://OWNER.github.io/REPO/flame-text.js` |
| **jsDelivr (from npm)** | `https://cdn.jsdelivr.net/npm/@codebystella/flame-text@VERSION/dist/flame-text.iife.js` — pin `VERSION` (e.g. `0.1.0`) or use `@latest` |

[unpkg](https://unpkg.com/) serves the same paths under `https://unpkg.com/@codebystella/flame-text@VERSION/dist/…`.

Enable Pages once: repo **Settings → Pages → Source: GitHub Actions**.

## Quick embed (ESM, npm)

```html
<script type="module">
  import { mount } from '@codebystella/flame-text'
  mount('#hero', { temperature: 0.65, intensity: 1 })
</script>
```

## Quick embed (ESM, URL)

```html
<script type="module">
  import { mount } from 'https://codebystella.github.io/flame-text/flame-text.js'
  mount('#hero', { temperature: 0.65, intensity: 1 })
</script>
```

## Quick embed (IIFE, CDN)

```html
<script src="https://codebystella.github.io/flame-text/flame-text.iife.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    FlameText.mount('#hero', { fontUrl: '/fonts/MyFont.woff2', temperature: 0.7 })
  })
</script>
```

The host element must be in the DOM and should use normal flow (the library wraps it in a `position: relative` container and adds a `pointer-events: none` canvas on top). **No opaque background** is drawn; only flame pixels are composited.

## API (short)

| Export | Description |
|--------|-------------|
| `mount(selector \| element, options?)` | Attach effect; returns `{ destroy, setTemperature, setIntensity }` |
| `autoInit()` | Mount every `[data-flame-text]` element with default options |

Options include `flamePadding` (extra canvas above/side/below the text so plumes are not clipped), `fontUrl`, `temperature` (0–1), `intensity`, `particleCount`, `wind`, `ignition`, `respectReducedMotion`. See [docs/api.md](docs/api.md).

## Development

```bash
npm install
npm run dev      # demo at http://localhost:5173
npm run build    # dist/*.js + declarations
npm test
npm run lint
```

## Docs

- [Embedding](docs/embed.md)
- [API](docs/api.md)
- [Fonts & troubleshooting](docs/troubleshooting.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT

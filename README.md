# FlameText

Embeddable **oil-on-fire** text: transparent canvas overlay, glyph-aware emission (OpenType when a font URL is available, otherwise canvas raster), particle plume, **temperature** and **intensity** controls, optional **ignition** intro.

## Install

```bash
npm install @codebystella/flame-text
```

## Quick embed (ESM)

```html
<script type="module">
  import { mount } from './node_modules/@codebystella/flame-text/dist/flame-text.js'
  mount('#hero', { temperature: 0.65, intensity: 1 })
</script>
```

## Quick embed (IIFE)

```html
<script src="./dist/flame-text.iife.js"></script>
<script>
  FlameText.mount('#hero', { fontUrl: '/fonts/MyFont.woff2', temperature: 0.7 })
</script>
```

The host element must be in the DOM and should use normal flow (the library wraps it in a `position: relative` container and adds a `pointer-events: none` canvas on top). **No opaque background** is drawn; only flame pixels are composited.

## API (short)

| Export | Description |
|--------|-------------|
| `mount(selector \| element, options?)` | Attach effect; returns `{ destroy, setTemperature, setIntensity }` |
| `autoInit()` | Mount every `[data-flame-text]` element with default options |

Options include `fontUrl`, `temperature` (0–1), `intensity`, `particleCount`, `wind`, `ignition`, `respectReducedMotion`. See [docs/api.md](docs/api.md).

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

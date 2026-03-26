# FlameText

Embeddable **oil-on-fire** text: transparent canvas overlay, glyph-aware emission (OpenType when a font URL is available, otherwise canvas raster), particle plume, **temperature** and **intensity** controls, optional **ignition** intro.

**Repository:** [github.com/CodeByStella/flame-text](https://github.com/CodeByStella/flame-text)  
**Live site (how to embed + interactive showcase):** [codebystella.github.io/flame-text/](https://codebystella.github.io/flame-text/)

## Install (npm / bundler)

```bash
npm install @codebystella/flame-text
```

```ts
import { mount } from '@codebystella/flame-text'
```

Publishing is automated: create a [GitHub Release](https://github.com/CodeByStella/flame-text/releases) whose tag matches `package.json` (e.g. tag `v0.1.0` and version `0.1.0`). You can also run **Publish npm** manually under **Actions**. Add an **`NPM_TOKEN`** [repository secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions) (npm [granular access token](https://docs.npmjs.com/about-access-tokens) with **Publish**). Until the first successful publish, use the GitHub Pages script URLs below or install from git.

## CDN / script embed

After each push to `main`, [GitHub Actions](.github/workflows/pages.yml) builds the library, assembles a small site (landing + showcase), and publishes **`_site/`** to **GitHub Pages**.

| What                  | URL (this repo)                                                                  |
| --------------------- | -------------------------------------------------------------------------------- |
| **Landing + demo**    | [codebystella.github.io/flame-text/](https://codebystella.github.io/flame-text/) |
| **IIFE (script tag)** | `https://codebystella.github.io/flame-text/flame-text.iife.js`                   |
| **ESM**               | `https://codebystella.github.io/flame-text/flame-text.js`                        |

For other forks, replace owner/repo: `https://OWNER.github.io/REPO/flame-text.iife.js`.

**jsDelivr / unpkg** (after the package is on npm):

`https://cdn.jsdelivr.net/npm/@codebystella/flame-text@VERSION/dist/flame-text.iife.js` — pin `VERSION` (e.g. `0.1.0`) or use `@latest`.

[unpkg](https://unpkg.com/) serves the same paths under `https://unpkg.com/@codebystella/flame-text@VERSION/dist/…`.

Enable Pages once: repo **Settings → Pages → Source: GitHub Actions**.

If the **deploy** job fails with **404** (“Failed to create deployment”): Pages is not active for this repo yet, or Actions cannot use it. Fix: open **Settings → Pages**, set **Source** to **GitHub Actions**, save, wait a minute, then **re-run** the workflow. You need **admin** on the repo. For an **organization** repo, an org owner may need to allow **GitHub Pages** under org **Settings → Pages** (or **Member privileges**). Under **Settings → Actions → General**, ensure **Workflow permissions** is not locked to read-only in a way that blocks the workflow’s `pages: write` / `id-token: write` scopes.

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

| Export                                 | Description                                                        |
| -------------------------------------- | ------------------------------------------------------------------ |
| `mount(selector \| element, options?)` | Attach effect; returns `{ destroy, setTemperature, setIntensity }` |
| `autoInit()`                           | Mount every `[data-flame-text]` element with default options       |

Options include `flamePadding` (extra canvas above/side/below the text so plumes are not clipped), `fontUrl`, `temperature` (0–1), `intensity`, `particleCount`, `wind`, `ignition`, `respectReducedMotion`. See [docs/api.md](docs/api.md).

## Development

```bash
npm install
npm run dev      # demo at http://localhost:5173
npm run build    # dist/*.js + declarations
npm test
npm run lint
```

Preview the GitHub Pages bundle locally (same as CI):

```bash
npm run pages:preview   # build + assemble _site/ + static server
```

## Docs

- [Embedding](docs/embed.md)
- [API](docs/api.md)
- [Fonts & troubleshooting](docs/troubleshooting.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT

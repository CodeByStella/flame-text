# Development

- **`src/`** — Library source (ESM-style `.js` imports in TypeScript for declaration emit).
- **`demo/`** — Vite dev app (`npm run dev`).
- **`tests/`** — Vitest (`npm test`).
- **Build** — `vite.lib.config.ts` bundles ESM + IIFE; `tsconfig.build.json` emits `.d.ts` into `dist/`.

For setup, checks before PRs, and conventions, see [CONTRIBUTING.md](../CONTRIBUTING.md).

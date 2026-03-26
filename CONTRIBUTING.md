# Contributing

Thanks for helping improve FlameText. Keep changes **focused** on the problem you are solving; match existing style and patterns in `src/`.

## Prerequisites

- **Node.js** 20+ (CI uses 22)
- **npm** (lockfile is `package-lock.json`; use `npm ci` in CI-style runs)

## Local setup

```bash
git clone <repository-url>
cd Flame
npm install
```

## Workflow

| Command | Purpose |
|--------|---------|
| `npm run dev` | Demo app at `http://localhost:5173` (edit `demo/` and `src/`) |
| `npm run build` | Production library in `dist/` + TypeScript declarations |
| `npm test` | Vitest unit tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (write) |

Before opening a PR, run **`npm run lint`**, **`npm test`**, and **`npm run build`** and fix any failures.

## Publishing to npm (maintainers)

CI publishes via [.github/workflows/publish-npm.yml](.github/workflows/publish-npm.yml) when a **GitHub Release is published** or when **Publish npm** is run manually (**Actions** tab).

1. Bump **`version`** in `package.json` on `main` and merge.
2. Create a **release** (and tag) whose name matches that version with a `v` prefix, e.g. version `0.2.0` → tag **`v0.2.0`**. The workflow checks that `package.json` and the tag agree.
3. In the repo on GitHub: **Settings → Secrets and variables → Actions** → add **`NPM_TOKEN`** with an npm [access token](https://docs.npmjs.com/about-access-tokens) that can publish the **`@codebystella`** scope (org membership or your npm account owning that scope).

## Project layout

See [docs/development.md](docs/development.md) for a short map of folders and build outputs.

## Code style

- **TypeScript** with strict settings; prefer explicit types on public APIs.
- **Imports** in `src/` use `.js` extensions in import paths (required for declaration emit).
- Run **Prettier** and **ESLint**; do not disable rules broadly without a reason.
- **Documentation**: update `README.md` or `docs/` when behavior or integration steps change.

## Pull requests

- Describe **what** changed and **why** in plain language.
- Link related issues if any.
- For visual or behavior changes, mention how you verified them (e.g. demo page, browser).

## License

By contributing, you agree that your contributions are licensed under the same terms as the project (see [LICENSE](LICENSE)).

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check via `tsc -b` then production-build via `vite build`
- `npm run lint` — run ESLint over the project
- `npm run preview` — serve the production build locally

There is no test runner configured in this project.

## Architecture

This is a minimal, largely unmodified Vite + React 19 + TypeScript scaffold (not yet a built-out application):

- `src/main.tsx` — entry point, mounts `<App />` into `#root` under `StrictMode`
- `src/App.tsx` — the single top-level component; all UI currently lives here
- `src/index.css` / `src/App.css` — global and component styles
- `src/assets/` — static assets imported directly into components (e.g. `hero.png`)
- `public/` — static files served as-is, referenced by absolute path (e.g. `icons.svg`, `favicon.svg`)
- `index.html` — Vite HTML entry point

TypeScript configuration is split via project references (`tsconfig.json` → `tsconfig.app.json` for app source, `tsconfig.node.json` for Vite config). `tsconfig.app.json` enables strict linting-adjacent checks: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`.

ESLint (`eslint.config.js`) uses flat config with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` (Vite-mode).

# Repository Guidelines

## Project Structure & Module Organization
- Vite + React 18 + TypeScript + Tailwind CSS 4; all source lives in `src`.
- `src/pages/*` holds routed views (dashboard, trend, configuration, logs, reports, schedule, users) wired in `src/App.tsx` with lazy loading and `Layout`.
- `src/components` contains shared UI (Radix/Lucide-driven) and `components/ui` primitives; styles live in `index.css` plus `styles/globals.css`.
- Build artifacts write to `build/` (see `vite.config.ts` for manual chunks and aliases like `@` to `src`).

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start Vite dev server on port 3000 with API proxy to `VITE_BACKEND_TARGET`.
- `npm run build` — production bundle to `build/`.

## Coding Style & Naming Conventions
- TypeScript strict mode; keep typed props/state and prefer functional components.
- Use the `@/` import alias instead of long relative paths; PascalCase for components and file names.
- Tailwind utility-first styling; compose conditional classes with `clsx`/`tailwind-merge`; keep class order readable (layout → spacing → color → state).
- Follow existing formatting: double quotes, semicolons, 2-space indentation.

## Testing Guidelines
- No automated tests yet; prefer Vitest + React Testing Library when adding coverage.
- Name files `*.test.tsx` co-located with components or under `src/__tests__`; cover routing, lazy boundaries, and the localStorage `isAuthenticated` flag.
- Document manual checks in PR descriptions until automation is in place.

## Commit & Pull Request Guidelines
- Use Conventional Commit style seen in history (`feat:`, `fix:`, `refactor:`, `chore:`) with concise scope (e.g., `feat: dashboard charts`).
- PRs should summarize user impact, list config/env changes, and include screenshots or recordings for UI updates.
- Reference related issues, note tests run, and call out risks (proxy path changes, Tailwind regressions).

## Security & Configuration Tips
- Store env vars in `.env.local` with Vite prefixes: `VITE_API_BASE_URL`, `VITE_BACKEND_TARGET`, `VITE_FRONTEND_ORIGIN`; do not commit secrets.
- Proxy/CORS settings live in `vite.config.ts`; align backend target with the deployment environment before merging.
- Remove sensitive sample data and unused dependencies when cleaning up features.

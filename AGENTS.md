# AGENTS.md

## Commands

```
npm run dev        # Start Vite dev server (HMR)
npm run build      # Typecheck + production build (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Preview production build
```

Run order: `lint` → `build` (includes typecheck). No test framework configured.

## Architecture

Single-page React app for **Comunikate Academy ** — a course enrollment management system.

- **Entry**: `src/main.tsx` → `src/App.tsx`
- **Router**: React Router v7 (`BrowserRouter`), not Inertia (despite `@inertiajs/react` in deps)
- **API proxy**: Vite dev server proxies `/api` → `http://localhost:8000`
- **Base URL**: `VITE_API_URL` env var, defaults to `http://localhost:8000/api`
- **Auth**: Bearer token stored in `localStorage` (`auth_token`), attached via axios interceptor
- **Protected routes**: All routes except `/matricula/nueva` and `/login` require auth

## Key Conventions

- **Path alias**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`)
- **Styling**: Tailwind CSS v4 + shadcn/ui (style: `radix-maia`). Icon lib: `hugeicons`
- **Custom colors**: `src/lib/constants.ts` defines `COLORS` (oklch values). Many components use inline `style` with these instead of Tailwind classes for colors.
- **cn utility**: `src/lib/utils.ts` — `twMerge(clsx(...))` for class merging
- **Forms**: React Hook Form + Zod (via `@hookform/resolvers`)
- **Notifications**: `sonner` (Toaster in App.tsx)

## TypeScript Strictness

- `noUnusedLocals` and `noUnusedParameters` are **enabled** — do not introduce unused variables/params
- `verbatimModuleSyntax` — use `import type` for type-only imports
- `erasableSyntaxOnly` — no TypeScript syntax that can't be erased (e.g., `enum`)

## Backend Contract

Auth endpoint: `POST /api/auth/iniciar-sesion` (login), `POST /api/auth/cerrar-sesion` (logout)

Response shape:
```ts
{ mensaje: string, datos: { token: string, usuario: { id, username, email, persona } } }
```

## Gotchas

- **No tests configured** — do not attempt to run tests
- **Hardcoded mock data** — CursosPage and MatriculasListPage use local arrays, not API calls yet
- **Spanish UI** — all labels, messages, and copy are in Spanish
- **`@inertiajs/react` is installed but unused** — app uses React Router directly

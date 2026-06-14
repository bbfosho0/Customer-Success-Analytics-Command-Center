# Frontend Architecture Blueprint (2025 Refresh)

A full-stack blueprint for rebuilding the local-first support analytics UI using the following stack:

- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Query (TanStack Query) for data fetching/caching
- Nivo and Recharts for charting, plus TanStack Table with the option to swap to AG Grid when enterprise grid features are required
- FastAPI backend with Pydantic models, auth stub (JWT/session), and typed client generation from OpenAPI (e.g., `openapi-typescript`)

The goal is to deliver an aesthetic, streamlined, and maintainable experience while staying aligned with the existing local ETL pipeline before the eventual AWS deployment.

---

## 1. Why This Stack Wins

### 1.1 Next.js App Router + React 18

- Server Components + streaming give near-instant paint for heavy dashboards without extra plumbing.
- Hybrid rendering (SSR/ISR/Edge) keeps metrics and tables fresh without overfetching.
- Built-in routing, layouts, and metadata simplify global nav, auth guards, and SEO.

### 1.2 TypeScript Everywhere

- Static typing on components, hooks, API payloads, and design tokens prevents runtime regressions.
- Works with generated API clients, ensuring contract drift between FastAPI and UI is caught at build time.

### 1.3 Tailwind CSS + shadcn/ui (Radix)

- Tailwind provides design tokens, responsive primitives, and a zero-runtime theming strategy.
- shadcn/ui delivers polished, accessible building blocks that we fully own; Radix primitives guarantee focus management, keyboard support, and ARIA compliance.
- The combination lets us ship bespoke visuals quickly with full control.

### 1.4 TanStack Query

- Declarative data fetching with background refresh, stale-while-revalidate behavior, and request deduplication.
- Query keys mirror FastAPI resources (e.g., `['calls', filters]`, `['agents', agentId]`), making cache invalidation predictable.
- Integrates seamlessly with Suspense/streaming and supports optimistic mutations for admin flows.

### 1.5 Nivo + Recharts + AG Grid/TanStack Table

- Nivo handles modern dashboards with themable SVG/canvas charts and polished defaults; Recharts covers simple trendlines or sparklines.
- TanStack Table is perfect for custom-styled tables with headless flexibility. When we need grouping, pivoting, or Excel-class features, AG Grid is the drop-in upgrade.
- Shared color palettes and theming across charts and tables keep visuals cohesive.

### 1.6 FastAPI + Typed Client Generation

- Pydantic models define a single source of truth for ETL outputs and analytics payloads.
- OpenAPI spec powers `openapi-typescript` (or `typescript-fetch`) to generate typed clients used directly by TanStack Query hooks.
- Auth stub (JWT/session) can be mocked locally, enabling secure patterns early.

### 1.7 Local-First Alignment

- FastAPI reads the same local Parquet/manifest artifacts produced by the Python ETL, keeping feedback loops short.
- No AWS dependencies are required until we are ready to point the frontend at remote endpoints.

---

## 2. High-Level Architecture

1. **FastAPI layer** exposes REST endpoints under `/api` for calls, agents, metrics, filters, and auth.
2. **API client package** (`src/lib/api/generated`) is regenerated whenever the FastAPI OpenAPI schema changes.
3. **Data hooks** (`src/lib/api/hooks.ts`) wrap client calls with TanStack Query, enforcing consistent query keys and error handling.
4. **UI layer** uses the Next.js App Router (`src/app`) with shared layouts, route groups, and feature modules under `src/features`.
5. **Design system** lives in `src/styles` (Tailwind config, tokens) and `src/components/ui` (shadcn/ui exports plus local primitives).
6. **Visualization utilities** (`src/lib/viz`) encapsulate chart themes, tooltip formatters, and data transforms so charts stay declarative.
7. **State** is split between TanStack Query (server data), context/Zustand for UI state (sidebar, theme, filters), and component-local state where appropriate.

---

## 3. Repository Structure (Frontend Portion)

```text
frontend/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout, theme script, query provider
│   │   ├── page.tsx               # Default route (redirect to /dashboard)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx         # Dashboard shell (sidebar, topbar)
│   │   │   └── page.tsx           # KPI grid + main visuals
│   │   ├── calls/
│   │   │   ├── page.tsx           # Calls explorer with table + filters
│   │   │   └── [callId]/page.tsx  # Drawer or standalone detail view
│   │   ├── agents/
│   │   │   └── page.tsx           # Agent performance view
│   │   ├── settings/
│   │   │   └── page.tsx           # Theme + data refresh controls
│   │   └── api/                   # Route handlers (if needed for proxying)
│   ├── components/
│   │   ├── layout/                # Shell, nav, breadcrumbs, footer
│   │   ├── charts/                # Reusable chart wrappers (Nivo/Recharts)
│   │   ├── tables/                # Table toolkits (TanStack Table, AG Grid)
│   │   ├── filters/               # Filter controls, chips, date pickers
│   │   ├── feedback/              # Skeletons, loaders, toasts, empty states
│   │   └── ui/                    # shadcn/ui exports + custom primitives
│   ├── features/
│   │   ├── dashboard/
│   │   ├── calls/
│   │   ├── agents/
│   │   └── settings/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── generated/         # OpenAPI-generated clients
│   │   │   ├── client.ts          # Fetch wrapper (auth headers, base URL)
│   │   │   └── hooks.ts           # useCalls, useAgents, useMetrics, etc.
│   │   ├── state/
│   │   │   ├── queryClient.ts     # Singleton TanStack Query client
│   │   │   └── uiStore.ts         # Zustand store for layout/filter state
│   │   ├── viz/                   # Chart themes, formatters, color helpers
│   │   ├── utils/                 # Date helpers, number formatters
│   │   └── constants/             # Route names, query keys, feature flags
│   ├── styles/
│   │   ├── globals.css
│   │   ├── themes.css             # CSS variables for light/dark
│   │   └── typography.css         # Optional font-face declarations
│   ├── providers/
│   │   ├── theme-provider.tsx
│   │   ├── query-provider.tsx
│   │   └── auth-provider.tsx      # Stub during local dev
│   └── tests/
│       ├── components/            # Vitest/RTL specs
│       └── e2e/                   # Playwright suites
└── public/
    ├── fonts/
    ├── icons/
    └── placeholder-images/
```

---

## 4. Routing, Layouts, and Navigation

1. **Root layout** wraps the entire app with `ThemeProvider`, `QueryClientProvider`, and global styles. It also mounts the `Toaster` for notifications and `TailwindIndicator` (dev-only).
2. **Dashboard route group (`/dashboard`)** uses a dedicated layout containing the permanent sidebar, top navigation, and responsive content grid. Tabular pages (`/calls`, `/agents`) reuse the same shell via parallel routes.
3. **Dynamic routes**: `/calls/[callId]` powers a deep link to a specific call detail. In desktop view it renders inside a drawer; on mobile it loads as a full page.
4. **Metadata routes**: each page defines `generateMetadata` for breadcrumbs, analytics, and share info.
5. **Navigation components**: `PrimaryNav` (sidebar), `SecondaryNav` (top actions), and `Breadcrumbs` live under `src/components/layout`. Active states and breadcrumbs derive from a single route config to avoid drift.

---

## 5. Design System & Styling

### 5.1 Tailwind Configuration

- Extend `tailwind.config.ts` with design tokens: color palette, spacing scale, font sizes, radii, shadows.
- Enable `darkMode: ['class']` and control via `ThemeProvider` storing preference in `localStorage` + system fallback.
- Register `@tailwindcss/typography`, `@tailwindcss/forms`, and `tailwindcss-animate` for prose, form polish, and motion utilities.

### 5.2 CSS Variables & Themes (`themes.css`)

- Define semantic tokens (`--color-bg`, `--color-surface`, `--color-border`, `--color-accent`, etc.) for light and dark modes.
- Chart palettes reference the same tokens to keep graphs in sync with the UI.

### 5.3 shadcn/ui Integration

- Scaffold the components we need (`button`, `card`, `dropdown-menu`, `dialog`, `sheet`, `tabs`, `toggle-group`, etc.).
- Wrap them in domain-specific components (e.g., `FilterChip`, `KpiCard`) to enforce consistent spacing and semantics.
- Use Radix state hooks for advanced interactions (combobox, slider, calendar) inside filters and settings forms.

### 5.4 Layout Primitives

- `Stack`, `Inline`, and `Grid` components encapsulate spacing logic for repeated patterns.
- `PageSection` (title, subtitle, actions) standardizes headers, while `ContentPanel` provides consistent padding/shadows.

### 5.5 Typography & Iconography

- Fonts: Inter (primary), Space Grotesk (display accents). Preload via `next/font` for CLS-free loading.
- Icons: Lucide (matching shadcn) for actions; `@iconify/react` for data-specific glyphs.

### 5.6 Motion Guidelines

- Use `framer-motion` for hero entrance, filter panel transitions, and count-up micro-interactions.
- Duration budget: 150–250 ms with ease-out curves. Prefer subtle translate/opacity combos over large-scale animations.

---

## 6. Data & State Management

### 6.1 Query Client Setup

- `src/lib/state/queryClient.ts` exports a singleton configured with retry set to 1 (fail fast), `staleTime` of 30s for metrics and 5m for reference data, plus `refetchOnWindowFocus` enabled for dashboards but disabled on table-heavy pages to avoid scroll jumps.

### 6.2 Query Keys

- `calls`: `['calls', filters]`
- `callDetail`: `['calls', callId]`
- `agents`: `['agents', filters]`
- `metrics`: `['metrics', timeRange]`
- `settings`: `['settings']`
- Keep keys centralized in `src/lib/constants/queryKeys.ts` to avoid typos.

### 6.3 Hooks

- `useCalls(filters)` returns paginated call data + metadata for table components.
- `useCallDetail(callId)` fetches detail payloads for modals/drawers.
- `useMetrics(range)` powers KPI cards, sparkline charts, and hero metrics.
- `useAgents(filters)` loads agent leaderboards and fuels Nivo radar/bar charts.
- `useManifest()` hits a FastAPI endpoint that exposes manifest metadata, enabling manual cache busts.

### 6.4 Mutations

- `useRefreshData()` triggers an ETL rerun via FastAPI (if available) or refreshes manifest metadata.
- `useUpdateSettings()` persists user preferences (theme, default filters) to local storage or backend stub.
- Provide optimistic UI for non-destructive mutations; fallback to toast notifications on failure.

### 6.5 UI State

- `uiStore` (Zustand) handles sidebar collapse, filter drawer open state, selected table rows, and theme preference.
- React context manages transient state like global toasts, modal stacking, and command palette.

---

## 7. API Integration & Auth Stub

1. **OpenAPI generation**: run `pnpm api:generate` (or `npm run api:generate`) to fetch `http://localhost:8000/openapi.json` and regenerate clients under `src/lib/api/generated`.
2. **Client wrapper (`client.ts`)**: wraps `fetch` with base URL, default headers, timeout handling, and JSON parsing. Injects auth tokens (JWT) stored in `HttpOnly` cookies or fallback local storage stub.
3. **Error normalization**: convert FastAPI error responses into a unified shape `{ status, code, message, details }`.
4. **Auth stub**: `AuthProvider` exposes `user`, `signIn`, `signOut`. During local dev it can mock a single admin user. Later, hook into FastAPI’s JWT endpoint.
5. **Middleware**: Next.js `middleware.ts` guards protected routes, redirecting to `/auth/sign-in` when tokens are missing.
6. **API Routes (optional)**: `src/app/api/*` can proxy requests or handle secure operations (e.g., uploading CSVs) until FastAPI endpoints exist.

---

## 8. Feature Modules & Page Blueprints

### 8.1 Dashboard (`/dashboard`)

- **Layout**: four-up KPI grid on top, two charts side-by-side (trendline + categorical breakdown), bottom section with condensed table or timeline.
- **Components**: `KpiCard`, `TrendChart`, `IssueBreakdownChart`, `CallVolumeHeatmap`, `InsightPanel` (textual summaries).
- **Data**: `useMetrics`, `useCalls({ latest: true })`, `useAgents({ top: 5 })`.
- **Interactions**: global filters (time range, region, issue type) controlling all widgets via context.

### 8.2 Calls Explorer (`/calls`)

- **Left column**: filter panel with date range picker, multi-selects (agent, region, rating), status toggles.
- **Right column**: TanStack Table (striped rows, sticky header, row selection). Toolbars for export, column visibility, density toggle.
- **Row detail**: clicking a row opens `CallDetailDrawer` (Radix `Sheet`) with timeline, notes, and actions.

### 8.3 Agents View (`/agents`)

- **Hero**: agent leaderboard cards showing average rating, resolution time.
- **Charts**: Nivo radar chart (skill matrix), bar chart (calls handled), scatter (rating vs duration).
- **Table**: aggregated stats per agent with inline sparklines.

### 8.4 Settings (`/settings`)

- Manage theme preference, default landing page, and data refresh controls (manual ETL trigger, manifest inspection).
- Provide diagnostics: last ETL timestamp, manifest hash, file size.

### 8.5 Auth (`/auth/sign-in`, `/auth/sign-out`)

- Minimal form built with shadcn `Form` + `react-hook-form`.
- Show sample credentials for local dev.

### 8.6 Shared Components

- `FilterBar`, `FilterChip`, `DateRangePicker`, `SegmentedControl` for quick filter toggles.
- `InsightList` for textual callouts (e.g., "High volume in EU region +12% WoW").
- `StatusBadge`, `RatingStars`, `CallDuration` display utilities.

---

## 9. Visualization Strategy

1. **Nivo** for primary dashboards: area, line, bar, heatmap, radar, and treemap charts. Centralize theme overrides in `src/lib/viz/nivoTheme.ts` to match Tailwind tokens.
2. **Recharts** for sparkline KPIs and minimal charts embedded in tables/drawers due to lighter bundle size.
3. **Chart data transforms** live in `src/lib/viz/transformers.ts` to keep components declarative.
4. **Interactivity**: tooltips with localized numbers, click-to-filter support (e.g., clicking a bar filters the table), legends doubling as toggles.
5. **Empty/loading states**: skeleton chart wrappers (semi-transparent rectangles) and `NoData` components with CTA to adjust filters.

---

## 10. Tables & Dense Data

### 10.1 TanStack Table Default

- Column definitions typed via `ColumnDef<CallRecord>`.
- Features enabled: sorting, column pinning (agent name, issue type), column visibility toggles, pagination, row selection, CSV export.
- Virtualized body via `@tanstack/react-virtual` for large datasets.
- Custom cell renderers for tags, badges, durations (HH:MM:SS), and inline sparklines.

### 10.2 AG Grid Upgrade Path

- Use when we need pivoting, grouping, aggregated footers, or Excel-like editing.
- Keep a shared adapter interface so `CallsTable` can switch between TanStack Table and AG Grid with minimal refactor.

### 10.3 Accessibility & UX

- Keyboard navigation (arrow keys, tab) supported through native table semantics.
- Sticky header + horizontal scroll for narrow screens; on mobile, fallback to card layout summarizing key fields.

---

## 11. Performance, Responsiveness, Accessibility

- **Performance budgets**: <2.5s Largest Contentful Paint on mid-tier laptop; <100ms interaction latency for filter toggles.
- **Code splitting**: lazy-load heavy charts and AG Grid only when their sections mount.
- **Edge caching**: use Next.js Route Handlers to cache semi-static data (agents list, manifest) for a few minutes while still allowing manual refresh.
- **Responsive strategy**: grid breakpoints aligned with Tailwind defaults; filter drawer becomes a modal on small screens.
- **Accessibility**: strict linting via `eslint-plugin-jsx-a11y`, keyboard trap tests for drawers/modals, color contrast tests baked into Storybook.

---

## 12. Tooling & Developer Experience

- **Package manager**: `pnpm` (fast installs, workspace support if needed).
- **Scripts**:
  - `pnpm dev` – Next.js dev server with hot reload.
  - `pnpm lint` – ESLint + TypeScript typecheck.
  - `pnpm test` – Vitest + React Testing Library.
  - `pnpm test:e2e` – Playwright.
  - `pnpm storybook` – Component previews.
  - `pnpm api:generate` – Regenerate OpenAPI clients.
- **VS Code extensions**: Tailwind CSS IntelliSense, Headwind, ESLint, Prettier, GitHub Copilot, Thunder Client, Iconify IntelliSense, shadcn UI snippets.
- **Formatting**: Prettier with Tailwind plugin to keep class order consistent.
- **Linting**: ESLint config extends `next/core-web-vitals` plus custom rules for query key consistency.
- **Storybook/Chromatic**: Visual regression coverage for KPI cards, charts, tables, and forms.

---

## 13. Testing Strategy

1. **Unit tests (Vitest + RTL)**: component-level coverage for filters, KPI cards, table renderers, and chart wrappers (mock data transforms).
2. **Integration tests (Playwright)**: ensure main flows work—loading dashboard, applying filters, viewing call detail, toggling theme.
3. **Contract tests**: run `pnpm api:lint` to verify generated clients match Pydantic schemas; fail CI if the OpenAPI spec changes without regenerating.
4. **Performance checks**: use Lighthouse CI or Calibre snapshots per merge to monitor LCP, TTI, and CLS.
5. **Accessibility audits**: Axe + Storybook a11y add-on as part of PR checks.

---

## 14. Implementation Phases

1. **Phase 0 – Scaffolding**
   - Initialize Next.js + Tailwind + shadcn/ui.
   - Configure ESLint, Prettier, Husky hooks, VS Code settings.
   - Add base layouts, fonts, and theme provider.

2. **Phase 1 – Data Plumbing**
   - Stand up FastAPI endpoints (local).
   - Generate API clients, establish query provider, build sample `useMetrics` hook.
   - Create placeholder dashboard page with skeletons.

3. **Phase 2 – Core Screens**
   - Implement dashboard hero (KPI cards, charts), filter bar, and manifest insights.
   - Build calls explorer table with TanStack Table, filter panel, and detail drawer.
   - Add agents view charts and leaderboard cards.

4. **Phase 3 – Polish & Accessibility**
   - Add animations, theme toggle, responsive tweaks.
   - Harden accessibility, add Storybook docs, integrate Chromatic.
   - Implement auth stub + protected routes.

5. **Phase 4 – Advanced Data & Testing**
   - Introduce AG Grid if needed, advanced analytics modules, and manual ETL trigger UI.
   - Expand Playwright coverage, Lighthouse budgets, and signed build artifacts.

---

## 15. Local Pipeline Alignment

- FastAPI endpoints read from the same `data/cleaned_calls.parquet` and `data/manifest.json` produced by `scripts/generate_parquet.py`.
- Provide a CLI or script (`scripts/dev-api.sh`) that:
  1. Activates the Python virtualenv.
  2. Runs FastAPI (`uvicorn api.main:app --reload`).
  3. Launches the Next.js dev server.
- Document environment variables (`FASTAPI_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_ENV`) in `.env.example`.
- When the AWS pipeline is ready, switch base URLs without changing the frontend architecture.

---

Use this blueprint as the authoritative plan for the frontend overhaul. Each section is meant to be actionable, so implementation can proceed feature-by-feature while keeping aesthetics, performance, and maintainability front and center.

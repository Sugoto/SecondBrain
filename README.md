# SecondBrain

A private, single-user dashboard for the things worth tracking daily: net worth and spending, calorie targets and lifts, and OMSCS coursework. Built as an installable PWA, mobile first, with a bottom-nav launcher and swipe navigation between views.

Amounts are in INR with lakh grouping, and the workout schedule reads the current day in `Asia/Kolkata`.

## Stack

|                             |                                                                             |
| --------------------------- | --------------------------------------------------------------------------- |
| Runtime and package manager | Bun                                                                         |
| Toolchain                   | [Vite+](https://viteplus.dev) (`vp`) — wraps Vite, Rolldown, Vitest, Oxlint |
| UI                          | React 19 with the React Compiler, TypeScript                                |
| Styling                     | Tailwind CSS v4, Radix primitives, OKLCH design tokens                      |
| Data                        | Supabase (Postgres + Google OAuth), Dexie for the IndexedDB cache           |
| State                       | TanStack Query, TanStack Virtual for long lists                             |
| Charts                      | ECharts                                                                     |
| Motion                      | Framer Motion, plus the View Transitions API                                |

## Getting started

```bash
bun install
```

```bash
bun run dev
```

The dev server comes up on `http://localhost:5173`. Sign-in is Google OAuth through Supabase, so a session is required to see anything past the login screen.

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `bun run dev`     | Dev server with HMR                           |
| `bun run build`   | Typecheck, then production build into `dist/` |
| `bun run lint`    | Oxlint over the project                       |
| `bun run preview` | Serve the built output                        |

`vp <command>` runs a built-in Vite+ command; `vp run <name>` runs a `package.json` script. See [AGENTS.md](AGENTS.md).

## Layout

```
src/
  components/
    home/        dashboard: net worth masthead, calorie target, today's lifts, notes
    finances/    portfolio, expenses, insights, budget, transaction dialog
    fitness/     nutrition, workouts, shopping list, meal planner
    omscs/       courses and semester tracking
    navigation/  bottom-nav launcher and in-section top tabs
    profile/     settings
    ui/          shadcn/Radix primitives
  hooks/         data fetching, auth, theme, privacy, haptics, swipe nav
  lib/           supabase client, Dexie schema, motion helpers
  index.css      M3 token base plus the --ui-* dashboard layer
```

Sections are `home`, `finances`, `fitness`, `omscs`, and `profile` (see [navigation.ts](src/types/navigation.ts)). Supabase tables in use: `transactions`, `user_stats`, `workouts`, `shopping_list`, `omscs_courses`.

## Privacy mode

`usePrivacy` masks holdings-level figures — net worth, assets, salary — behind `₹•••`, while leaving transactions, budgets, and analysis tools readable. Use the asset-aware formatters (`useAssetCurrency`, `useAssetCurrencyCompact`) for anything that should mask, and the plain ones for anything that should not.

## Design

[DESIGN.md](DESIGN.md) is the source of truth for surfaces, ink, type, and the accent role, including which screens have been migrated to the current visual system and which have not. Read it before touching UI.

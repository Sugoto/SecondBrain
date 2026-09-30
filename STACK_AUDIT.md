# Stack audit — 2026-09-30

Research snapshot. Versions come from the npm registry on the date above.

> **Correction:** this audit assumed an iOS / Safari phone. The app actually runs on Android / Chrome, so many "skip — not in Safari" items below are available after all (Temporal, CSS `if()`, `interpolate-size`, Background / Periodic Sync, Web Share Target, manifest shortcuts, element-scoped view transitions).

Items marked UNVERIFIED could not be confirmed from a primary source. Items marked UNVERIFIED could not be confirmed from a primary source.

## Bun crash (fixed)

`bun dev` and `bun run build` were dying with SIGTRAP (exit code 133). The installed Bun was 1.3.8, even though `devEngines` pins 1.3.14. The macOS crash reports showed the same fault each time: when a JavaScriptCore thread (`Wasm Worklist Helper Thread` / `Worker`) exited, its thread-local cleanup freed a pointer that was never allocated (`POINTER_BEING_FREED_WAS_NOT_ALLOCATED` in `_pthread_tsd_cleanup`). That is a runtime bug. `bun upgrade` to 1.4.2 fixed it, and both commands now run cleanly.

Still open, separate and intermittent: [oven-sh/bun#42687](https://github.com/oven-sh/bun/issues/42687). On macOS 27 a new Bun process can die about 1 ms after starting. A retry works. If it shows up often, change `bunx --bun vp` to `bunx vp` so Vite+ runs on Node.

## Problems in the current code (verified locally)

1. **1.5 MB main chunk.** `FinanceTracker.tsx` imports `InvestmentsView` eagerly, and the charts use the default `echarts-for-react` import, which loads the full ECharts build.
2. **Supabase legacy keys are deprecated by end of 2026.** `appScript.js` sends `Authorization: Bearer ${SUPABASE_KEY}`. The new secret keys must go in the `apikey` header only.
3. **Dead code in `index.html`.**
   - A speculation-rules block, which does nothing: the app has no `<a href>` links and Safari doesn't support it.
   - The Google sign-in script (`accounts.google.com/gsi/client`), which is never used because login goes through the Supabase redirect.
4. **Million.js is abandoned**, and `@million/lint` is deprecated on npm. It overlaps with React Compiler and forces Babel 7 into the build.
5. **`vite-plugin-compression` output is wasted.** It is abandoned, and Vercel ignores the uploaded `.br`/`.gz` files because it compresses at its edge.
6. **Offline writes are not persisted.** On every fetch, `db.ts` clears and re-inserts all rows, capped at 500. It also indexes `category`/`type` columns that no longer exist.
7. **Possible wrong snapshot in page transitions.** `useViewTransition` calls `startViewTransition` without `flushSync`, so the "after" snapshot may be taken before React re-renders (UNVERIFIED in practice).
8. **Manifest issues.** The manifest `theme_color` (`#070709`) doesn't match the meta tag (`#121523`), and there's no `id` and no maskable icon.

## Packages

| Package                                                                                                                                                  | Ours               | Latest                    | Action                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------- | ----------------------------------------------------------------------------------- |
| bun                                                                                                                                                      | 1.3.8 (pin 1.3.14) | 1.4.2                     | Upgraded locally; bump the `devEngines` pin                                         |
| vite-plus + vite alias                                                                                                                                   | 0.2.8              | 1.0.0                     | `vp migrate` (Vitest 5, newer minimum Node); keep the alias at vite-plus-core@1.0.0 |
| million, @million/lint                                                                                                                                   | 3.1.11 / 1.0.14    | dead / deprecated         | Remove                                                                              |
| framer-motion                                                                                                                                            | 12.43              | superseded by `motion` 13 | Switch to `motion`; imports become `motion/react`                                   |
| vite-plugin-compression                                                                                                                                  | 0.5.1              | abandoned                 | Remove (Vercel compresses itself)                                                   |
| @radix-ui/react-* ×29                                                                                                                                    | —                  | `radix-ui` 1.6.7          | `npx shadcn@latest migrate radix`                                                   |
| vaul                                                                                                                                                     | 1.1.2              | unmaintained              | Plan a replacement                                                                  |
| @vitejs/plugin-react                                                                                                                                     | 6.0.5              | 6.1.1                     | Bump; adds the experimental native React Compiler (`compiler: true`)                |
| @babel/core                                                                                                                                              | 7.29               | 8.0.6                     | Drop Babel entirely once Million.js is gone and the native compiler is proven       |
| react / react-dom / @types                                                                                                                               | 19.2.8             | 19.3.0                    | Bump (adds `<ViewTransition>` and Trusted Types)                                    |
| supabase-js, react-query, react-virtual, lucide, tailwind-merge, sonner, input-otp, dexie, react-resizable-panels, react-hook-form, globals, @types/node | minor/patch behind | —                         | Routine bump                                                                        |
| typescript 7.0.2, tailwindcss 4.3.3, echarts 6.1, date-fns 4.4, react-day-picker 10, vite-plugin-pwa 1.3, cmdk, embla 8, cva, tw-animate-css             | current            | —                         | Keep                                                                                |
| @dnd-kit (legacy line)                                                                                                                                   | 6.3.1              | rewrite 0.5.0 (pre-1.0)   | Keep; watch                                                                         |
| next-themes                                                                                                                                              | 0.4.6              | stale but works           | Optional: shadcn's Vite ThemeProvider                                               |

## Platform and stack improvements

| Area     | Item                                                                                                                                                                                       | Fit                                                                         | Effort | Rec                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------ | --------------------------------- |
| React    | `<Activity>` (19.2)                                                                                                                                                                        | Keep section state (filters, dialogs) across tab switches                   | S–M    | Adopt                             |
| React    | `<ViewTransition>` + `addTransitionType` (19.3)                                                                                                                                            | Replace `useViewTransition`; direction-aware swipes                         | M      | Adopt                             |
| React    | `useEffectEvent`                                                                                                                                                                           | Clean up effects in `useSwipeNavigation` / `useAuth`                        | S      | As touched                        |
| Data     | React Query IndexedDB persister + paused mutations + `navigator.storage.persist()`                                                                                                         | Replaces most of `db.ts`; offline writes survive                            | S–M    | Adopt                             |
| Data     | TanStack DB / PowerSync                                                                                                                                                                    | Real local-first sync against Supabase                                      | L      | Trial if needed                   |
| Data     | Zero, Electric, Triplit, Jazz, Instant                                                                                                                                                     | Too much for 5 tables                                                       | —      | Skip                              |
| Supabase | Publishable/secret keys + asymmetric JWT (`getClaims`)                                                                                                                                     | Deadline                                                                    | S      | **Adopt now**                     |
| Supabase | `supabase gen types` + RLS audit                                                                                                                                                           | Would have caught the stale `db.ts` columns                                 | S      | Adopt                             |
| Supabase | Realtime on transactions                                                                                                                                                                   | Apps Script inserts appear live                                             | S      | Trial                             |
| AI       | Claude via an Edge Function on insert                                                                                                                                                      | Auto-categorise transactions; natural-language entry ("coffee 180 hdfc")    | M      | Trial                             |
| PWA      | Declarative Web Push + badge (iOS 18.4+)                                                                                                                                                   | "₹X spent at Y" notification per ingested transaction                       | M      | Trial                             |
| PWA      | Manifest `id`, maskable icon, `theme_color` fix                                                                                                                                            | Hygiene                                                                     | S      | Adopt                             |
| CSS      | `field-sizing: content`, `@starting-style`, `light-dark()`, popover + `commandfor`                                                                                                         | Auto-grow notes; CSS entry animations; fewer theme blocks; menus without JS | S each | Adopt                             |
| CSS      | Scroll-driven animations (Safari 26)                                                                                                                                                       | Home header collapse without a JS scroll listener                           | S–M    | Trial                             |
| CSS      | Anchor positioning (Safari 26)                                                                                                                                                             | Tooltips/popovers without Radix positioning                                 | M      | Trial                             |
| Dates    | One `Intl.DateTimeFormat` "today in Asia/Kolkata" helper                                                                                                                                   | Replaces the `toLocaleString` hack in `HomePage` / `WorkoutsView`           | S      | Adopt                             |
| Dates    | Temporal                                                                                                                                                                                   | Not in Safari yet                                                           | M      | Watch                             |
| Tooling  | `vp test` with Vitest browser mode + screenshots                                                                                                                                           | The only realistic test path given Google login                             | S–M    | Adopt                             |
| Tooling  | Native React Compiler via Oxc (no Babel)                                                                                                                                                   | Faster builds                                                               | S      | Trial after Million.js is removed |
| Tooling  | Bundle visualiser                                                                                                                                                                          | Would have caught problem 1                                                 | S      | Adopt once                        |
| Deploy   | `vercel.json`: immutable caching for hashed assets, CSP / Trusted Types                                                                                                                    | Security and caching                                                        | S      | Trial                             |
| Fonts    | Self-hosted subsetted variable fonts                                                                                                                                                       | Drops the Google Fonts round trips                                          | S–M    | Adopt                             |
| Skip     | Speculation rules, cross-document view transitions, CSS `if()`, Background Sync, File System Access, WebGPU, Chrome built-in AI, WebLLM, RSC, router migration, Base UI migration, Serwist | Not supported on iOS, or no fit                                             | —      | Skip / watch                      |

## Roadmap

1. Tree-shake ECharts (`echarts/core`) and lazy-load `InvestmentsView`.
2. Move to Supabase publishable/secret keys, including the Apps Script header fix.
3. Build cleanup: remove Million.js, the compression plugins, the speculation rules and the sign-in script; bump the Bun pin.
4. `vp migrate` to Vite+ 1.0, `motion`, `radix-ui`, and the routine bumps.
5. React Query persister and offline mutations, replacing `db.ts`.
6. Supabase typegen and an RLS audit.
7. `vp test` for the date and lakh helpers, then screenshot tests.
8. React 19.3 `<ViewTransition>` + `<Activity>`.
9. Claude categorisation Edge Function, then Web Push and a badge.
10. CSS wins (`field-sizing`, `@starting-style`, scroll-driven header), manifest fixes, self-hosted fonts, then a trial of the native React Compiler.

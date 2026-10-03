<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# SecondBrain

A private single-user PWA dashboard: finances, health, and OMSCS coursework. Mobile first, INR with lakh grouping, workout schedule keyed to `Asia/Kolkata`. See [README.md](README.md) for the stack and layout.

## How it is used

Transactions are auto-synced from email, so adding or editing an expense by hand is rare. The finance screens are for reviewing spend, not data entry. Optimise for scanning and reviewing; do not make manual entry (the + button, the transaction sheet) more prominent or faster at the expense of the list.

## Before touching UI

Read [DESIGN.md](DESIGN.md). It defines the current visual system — panel surfaces on a recessed page, semantic ink tokens, monospace numerics, one accent role — and lists which screens have been migrated to it and which are still on the retired hairline vocabulary. The two look nothing alike, so matching the file you happen to open is not a reliable guide.

Three traps worth knowing before you start:

- **Never use alpha modifiers for muted text** (`text-foreground/60`). Use `--ui-ink-soft` / `--ui-ink-softer`. Opacity compositing is not symmetric between light and dark, so one alpha cannot pass contrast in both.
- **Transaction row heights are exact constants** in [ExpensesView.tsx](src/components/finances/ExpensesView.tsx), because the virtualizer runs without a measurement pass. Change a row's padding or font size and you must update the constant.
- **Do not display a date via `new Date(txn.date)`.** A bare `YYYY-MM-DD` parses as UTC midnight and can render the previous day. Use `formatDayLabel` in [constants.ts](src/components/finances/constants.ts).

## Verification

`bun run build` typechecks and builds. `bun run lint` currently reports 24 pre-existing `no-floating-promises` warnings and exits non-zero — compare the count against `main` rather than expecting zero.

Auth is Google OAuth through Supabase, so a real session is needed to reach anything past the login screen. There is no fixture or dev bypass.

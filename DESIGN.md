# DESIGN.md — SecondBrain

Quiet, substantial, type-led. Panels with real edges and generous padding, not hairlines dividing a flat page. Monospace for every quantity, one accent hue doing one job, and colour used where it carries information.

This replaces an earlier hairline-and-eyebrow direction ("hairlines, not boxes", "no filled metric containers", tracked-out ALL-CAPS labels above every section). That direction was retired on 2026-09-09. If you find code still written that way, it has not been migrated yet, not that this document is out of date.

## Principles

1. **Substance over hairlines.** Separation comes from a panel: a lighter surface on a recessed page, a tokened 1px edge, 14px radius, and a soft lift. Full-bleed `border-t` rules dividing sections are the pattern this replaced.
2. **Semantic ink, never alpha.** Muted text uses `--ui-ink-soft` / `--ui-ink-softer`, which are defined per theme. Do **not** write `text-foreground/60` — opacity compositing is not symmetric between light and dark, and the same alpha that passes AA on white fails on a dark panel.
3. **Mono for every quantity.** `.ui-num` on anything numeric. It carries `tnum`/`zero` itself, so it does not depend on `.font-mono`.
4. **Sentence case.** No uppercase tracked-out eyebrow labels. A section opens with a plain 13px label in the accent colour.
5. **One accent, one job.** `--ui-accent` marks _the label that opens a section_ — and nothing else, apart from the value ticks and the budget fill. Resist adding a second accent role.
6. **Colour must inform.** The three launcher hues encode section identity. The value ticks encode an ordinal rating through one hue's fill count, not a red/green verdict. Decorative colour has no place here.
7. **Verify contrast numerically.** Every ink/surface pair in use clears 4.5:1 in both themes. Compute it; do not eyeball OKLCH.

## Tokens

Declared at `:root` and overridden in `.dark`, at the end of [src/index.css](src/index.css). They sit on top of the existing M3 tokens rather than replacing them.

| Role           | Token              | Notes                                                                 |
| -------------- | ------------------ | --------------------------------------------------------------------- |
| Recessed page  | `--ui-page`        | Panels sit on this, so it is _darker_ than `--ui-panel` in light mode |
| Panel surface  | `--ui-panel`       | The raised plane content lives on                                     |
| Inset well     | `--ui-inset`       | Segmented-control tracks, macro strips, row hover                     |
| Panel edge     | `--ui-edge`        | The 1px border of a panel                                             |
| Interior rule  | `--ui-rule`        | Between rows _inside_ a panel only                                    |
| Primary text   | `--ui-ink`         |                                                                       |
| Secondary text | `--ui-ink-soft`    |                                                                       |
| Tertiary text  | `--ui-ink-softer`  | Floor for legible text; do not go quieter                             |
| Accent         | `--ui-accent`      | Section labels, value ticks, budget fill                              |
| Accent wash    | `--ui-accent-soft` | Available; currently unused                                           |
| Elevation      | `--ui-lift`        | Soft shadow in light, a 1px inset top highlight in dark               |

**Plate** — the dark indigo slab used for the home masthead and the bottom nav. Dark in _both_ themes, so its ink tokens do not flip.

`--ui-plate`, `--ui-plate-ink`, `--ui-plate-ink-soft`, `--ui-plate-edge`, `--ui-plate-accent` (the green status dot).

**Section hues** — launcher identity, applied to the nav icon only, via the optional `color` field on `NavItem`. Low chroma at ~72–75% lightness so all three read on the plate.

`--ui-hue-study` (OMSCS, indigo), `--ui-hue-money` (Finances, green), `--ui-hue-body` (Health, rose).

Never introduce raw `#000`/`#fff`, and never reach for untinted Tailwind palette colours like `border-zinc-300` — that mismatch against the indigo-tinted neutrals is what made the old hairlines look grubby.

## Typography

Loaded in [index.html](index.html).

- **UI and headings:** Instrument Sans (400/500/600/700) via `--ui-sans`
- **Numerics:** Spline Sans Mono (400/500/600) via `--ui-mono`, which covers `U+20B9` (₹) in its latin-ext subset

Before swapping either face, confirm the new one serves `U+20AD-20C0` from Google Fonts, or ₹ will fall back mid-number at hero size:

```bash
curl -s "https://fonts.googleapis.com/css2?family=Your+Font&display=swap" | grep "U+20AD-20C0"
```

The global Tailwind tokens (`--font-sans`, `--font-heading`, `--font-mono`) still point at Geist for unmigrated screens. Both font pairs load on every page as a result.

### Scale

| Use               | Spec                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Hero numeric      | `.ui-num text-[clamp(38px,11.5vw,54px)] font-medium leading-none tracking-[-0.02em]`                    |
| Panel metric      | `.ui-num text-[34px] font-medium leading-none`                                                          |
| Name / page title | `text-[30px] font-semibold tracking-[-0.02em]` (masthead), `text-[17px] font-semibold` (section header) |
| Section label     | `text-[13px] font-medium text-[var(--ui-accent)]`                                                       |
| Body / row title  | `text-[14px] text-[var(--ui-ink)]`                                                                      |
| Secondary line    | `text-[11px]`–`text-[13px] text-[var(--ui-ink-softer)]`                                                 |
| Inline numeric    | `.ui-num text-[12px]`–`text-[15px]`                                                                     |

`tracking-[-0.02em]` on the hero was tuned for a wider mono. Re-check it when the mono changes.

## Utilities

All in `@layer utilities`, so they beat the `@layer base` `h1..h6 { font-family: Geist }` rule.

- `.ui-surface` — page level: sets `--ui-sans` and the recessed page background
- `.ui-type` — type only, for a component living inside an unmigrated page
- `.ui-num` — mono with `tnum`/`zero`
- `.ui-panel` — panel surface, edge, 14px radius, lift
- `.ui-plate` — the dark slab plus its ink colour
- `.ui-inset` — inset well, 10px radius
- `.ui-ruled` — notebook rules for the notes textarea; `background-attachment: local` keeps them locked to the text while it scrolls

## Components

### Masthead plate (home)

Greeting, first name, profile button, hero net worth, and a daily-rate line with a green status dot. Fixed, not scrolling, because it holds the only route to the profile page. Rounded bottom corners only.

### Panel

```tsx
<section className="ui-panel px-5 pt-5 pb-4">
  <h2 className="text-[13px] font-medium text-[var(--ui-accent)]">Eat today</h2>
  <p className="text-[13px] text-[var(--ui-ink-softer)]">Body copy</p>
</section>
```

### Day card (transactions)

Assembled from separately positioned virtual rows: a header with `rounded-t-[14px] border-x border-t`, rows with `border-x` and a `--ui-rule` bottom, and a last row with `rounded-b-[14px]` and a `--ui-edge` bottom. No shadow, because a box-shadow on each piece would seam.

Row heights are exact constants in [ExpensesView.tsx](src/components/finances/ExpensesView.tsx) (`TXN_HEIGHT`, `HEADER_HEIGHT`, `CARD_GAP`) so `useVirtualizer` needs no measurement pass. **If you change a row's padding or font size, update the constant.** Headers use `justify-end`, so a constant that is slightly too large shows as extra gap rather than clipping the card top.

### Segmented control

An `.ui-inset` track with `role="tablist"`; the active segment is a raised `--ui-panel` pill with accent text. See `TopTabs`.

### Launcher (bottom nav)

A floating `.ui-plate` bar, inset from the edges, above the safe area. 60px tall, `font-semibold` labels, icons tinted by section hue. Rendered only on the home page, so it needs no active state. Per-button radius must be `rounded-none first:rounded-l last:rounded-r` — a radius on every button traces phantom curves on the focus ring.

### Value ticks

Five 3×6px bars, filled to the rating in `--ui-accent`, unfilled in `--ui-edge`. `role="img"` with an `aria-label` naming the rating from `VALUE_RATING_LABELS`.

## Motion

- `transition-colors` for state changes. No bounce, no spring.
- `active:scale-95` on icon buttons, `active:scale-[0.97]` on nav items.
- Animate opacity and transform only.
- **Respect `prefers-reduced-motion` by gating the render, not the prop.** `AnimatedNumber`'s `animateOnMount` only sets initial state; when the value later arrives from the network it animates regardless. Home does `animate ? <AnimatedNumber/> : <span>{value}</span>`.
- View Transitions in [src/index.css](src/index.css) stay.

## Dates

Never `new Date("2026-09-08")` for display. A bare `YYYY-MM-DD` parses as UTC midnight and renders the previous day in some timezones. Use `formatDayLabel` in [constants.ts](src/components/finances/constants.ts). The older `formatDate` still has this bug and wants fixing.

## Bans

- Alpha modifiers on text colour (`text-foreground/60`) — use the ink tokens.
- Untinted Tailwind neutrals (`border-zinc-*`) anywhere near these surfaces.
- Uppercase tracked-out eyebrow labels.
- A second accent role. A third accent colour.
- Nested panels. A panel inside a panel is always wrong.
- Identical rounded cards stacked down the page — vary the treatment so sections are distinguishable by shape, not just content.
- Gradient text, glassmorphism, drop shadows as decoration.
- Numbers in the sans face.
- Em dashes in copy (commas, colons, periods, parentheses).

## Migration status

**Migrated:** home (`HomePage`, `NutritionSummary`, `Notes`), navigation (`DynamicBottomNav`, `TopTabs`, `constants`), finances (`ExpensesView`, `TransactionCard`, `FinanceTracker` chrome and budget bar, `DateFilter` trigger, `Footer` border).

**Not migrated:** login, profile, OMSCS, the fitness views, all dialogs, and the `DateFilter` popover — that one is still all-caps behind a migrated trigger and is the most visible remaining seam.

Mirror the patterns above when migrating a surface, and add `.ui-surface` at the page root or `.ui-type` at the component root so the type follows.

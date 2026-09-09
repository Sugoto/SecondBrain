# DESIGN.md — SecondBrain

Quiet, substantial, type-led. Panels with real edges and generous padding, not hairlines dividing a flat page. Monospace for every quantity, one accent hue doing one job, and colour used where it carries information.

This replaces an earlier hairline-and-eyebrow direction ("hairlines, not boxes", "no filled metric containers", tracked-out ALL-CAPS labels above every section). That direction was retired on 2026-09-09. If you find code still written that way, it has not been migrated yet, not that this document is out of date.

## Principles

1. **Substance over hairlines.** Separation comes from a panel: a lighter surface on a recessed page, a tokened 1px edge, 14px radius, and a soft lift. Full-bleed `border-t` rules dividing sections are the pattern this replaced.
2. **Semantic ink, never alpha.** Muted text uses `--ui-ink-soft` / `--ui-ink-softer`, which are defined per theme. Do **not** write `text-foreground/60` — opacity compositing is not symmetric between light and dark, and the same alpha that passes AA on white fails on a dark panel.
3. **Mono for every quantity.** `.ui-num` on anything numeric. It carries `tnum`/`zero` itself, so it does not depend on `.font-mono`.
4. **Sentence case.** No uppercase tracked-out eyebrow labels. A section opens with a plain 13px label in the accent colour.
5. **One accent, a closed list of jobs.** `--ui-accent` marks the label that opens a section, the value ticks, the budget fill, and the single primary action on a surface. That list is closed: adding a sixth job is how an accent stops meaning anything. Text sitting _on_ an accent fill uses `--ui-accent-ink`, which flips with the theme.
6. **Colour must inform.** The three launcher hues encode section identity. The value ticks encode an ordinal rating through one hue's fill count, not a red/green verdict. Decorative colour has no place here.
7. **Verify contrast numerically.** Every ink/surface pair in use clears 4.5:1 in both themes. Compute it; do not eyeball OKLCH.

## Tokens

Declared at `:root` and overridden in `.dark`, at the end of [src/index.css](src/index.css). They sit on top of the existing M3 tokens rather than replacing them.

| Role            | Token               | Notes                                                                           |
| --------------- | ------------------- | ------------------------------------------------------------------------------- |
| Recessed page   | `--ui-page`         | Panels sit on this, so it is _darker_ than `--ui-panel` in light mode           |
| Panel surface   | `--ui-panel`        | The raised plane content lives on                                               |
| Inset well      | `--ui-inset`        | Tracks, text inputs, macro strips, row hover. Below the page, not level with it |
| Panel edge      | `--ui-edge`         | The 1px border of a panel                                                       |
| Interior rule   | `--ui-rule`         | Between rows _inside_ a panel only                                              |
| Primary text    | `--ui-ink`          |                                                                                 |
| Secondary text  | `--ui-ink-soft`     |                                                                                 |
| Tertiary text   | `--ui-ink-softer`   | Floor for legible text; do not go quieter                                       |
| Accent          | `--ui-accent`       | Section labels, value ticks, budget fill, the one primary action                |
| Accent wash     | `--ui-accent-soft`  | Chip background                                                                 |
| Accent ink      | `--ui-accent-ink`   | Text on an accent fill. Light in light mode, dark in dark mode                  |
| Accent on plate | `--ui-accent-plate` | The accent at plate-safe lightness. Same in both themes                         |
| Danger          | `--ui-danger`       | Destructive action and error text                                               |
| Danger ink      | `--ui-danger-ink`   | Text on a danger fill                                                           |
| Elevation       | `--ui-lift`         | Soft shadow in light, a 1px inset top highlight in dark                         |

**Plate** — the dark indigo slab used for the home masthead and the bottom nav. Dark in _both_ themes, so its ink tokens do not flip.

`--ui-plate`, `--ui-plate-ink`, `--ui-plate-ink-soft`, `--ui-plate-edge`, `--ui-plate-accent` (the green status dot).

**Section hues** — launcher identity, applied to the nav icon only, via the optional `color` field on `NavItem`. All three share one lightness and one chroma (76% / 0.12) so they read as a set rather than three unrelated colours.

`--ui-hue-study` (OMSCS), `--ui-hue-money` (Finances, green), `--ui-hue-body` (Health, rose). `--ui-hue-study` is not its own blue: it is `--ui-accent-plate`, the accent at the lightness the dark plate needs. `--ui-plate-accent` (the status dot) is `--ui-hue-money`.

**One blue.** There is exactly one accent-role blue, and `--ui-accent` is the only place it is stated literally. `--primary`, `--ring`, `--chart-1` and the `--primary-foreground` / `--primary-container` pair all resolve to it or to its ink and wash, so a shadcn focus ring and a migrated section label are the same colour by construction rather than by coincidence. Light `--ui-accent` and light `--primary` used to be two different blues (48%/0.17 against 42%/0.20), and `--pastel-blue` sat on hue 240 while the whole system is hue 275.

Still hue 275 but deliberately _not_ accent-role, so they stay literal: `--secondary` (chroma 0.05, a tinted neutral), the `--ui-plate*` slab tokens, and `--chart-2`–`--chart-5` (unused; both charts build grayscale ramps inline). If you need another accent-role step of blue, derive it from `--ui-accent`.

**The surface ladder.** Read top to bottom: `--ui-panel` (raised) → `--ui-page` → `--ui-inset` (recessed). Every rung must be visible against both of its neighbours, because an inset track gets laid straight onto the page as often as it gets laid onto a panel. The first version of these tokens put page and inset within 0.4% lightness of each other, which made the budget bar's empty track and both segmented tracks disappear in light mode. If you retune one rung, check it against the other two.

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
- `.ui-inset` — inset well, 10px radius. Also the resting state of a text input
- `.ui-chip` — pill carrying one short fact, on the accent wash. Sizing is the caller's
- `.ui-chip-quiet` — the same pill when the fact is neutral. Declared after `.ui-chip`, so it overrides it by source order
- `.ui-cta` — the one primary action: accent fill, `--ui-accent-ink` text
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

The header carries the date in the accent colour and the day's total as a quiet chip. The chip is suppressed when the day holds a single transaction, because the row below already states that number.

Row heights are exact constants in [ExpensesView.tsx](src/components/finances/ExpensesView.tsx) (`TXN_HEIGHT`, `HEADER_HEIGHT`, `CARD_GAP`) so `useVirtualizer` needs no measurement pass. **If you change a row's padding or font size, update the constant.** Headers use `justify-end`, so a constant that is slightly too large shows as extra gap rather than clipping the card top.

### Segmented control

An `.ui-inset` track with `role="tablist"`; the active segment is a raised `--ui-panel` pill with accent text. See `TopTabs`.

### Launcher (bottom nav)

A floating `.ui-plate` bar, inset from the edges, above the safe area. 60px tall, `font-semibold` labels, icons tinted by section hue. Rendered only on the home page, so it needs no active state. Per-button radius must be `rounded-none first:rounded-l last:rounded-r` — a radius on every button traces phantom curves on the focus ring.

### Value ticks

Five 3×6px bars, filled to the rating in `--ui-accent`, unfilled in `--ui-edge`. `role="img"` with an `aria-label` naming the rating from `VALUE_RATING_LABELS`.

The editor in `TransactionDialog` draws the same five bars, each in its own 44px tap target, with the selected label spelled out beside the caption. Display and edit share one vocabulary on purpose.

Groups of one-tap options (the rating strip, the settings segmented controls) are plain buttons with `aria-pressed` inside a `role="group"`, **not** `role="radiogroup"`. Radio semantics promise arrow-key navigation and a single tab stop; nothing here implements that, so claiming it would be a lie to a screen reader.

### Dialog

`DialogContent` and `AlertDialogContent` render through a portal, so they are **not** inside `.ui-surface` and need `ui-type` on the content element or the whole modal falls back to Geist. Pass `showCloseButton={false}` when the footer already offers Cancel. Clamp the responsive width too (`sm:max-w-md`), because the primitive sets `sm:max-w-lg` in a variant your base class cannot merge away.

Shape: 18px radius, `--ui-panel` surface, `--ui-edge` border, no internal gap. A 13px accent label is the `DialogTitle`; inputs are `.ui-inset` wells that grow a 1.5px accent inset ring on focus; the footer is a `--ui-edge` rule with Cancel and a `.ui-cta` that names its action ("Add expense", "Save changes").

### Settings page

Sections are given different silhouettes so the page is navigable by shape and not only by heading: identity on a `.ui-plate` strip echoing the home masthead, appearance as a segmented control plus one stateful chip row, budget as a single oversized figure in an `.ui-inset` well. Assets and Health both use ruled numeric rows in a panel, which is deliberate: they are the same kind of content, and the Health panel is followed by three segmented controls that separate it. Units live as a prefix or suffix on the input, never in the label's parentheses.

Segmented controls use text labels. Icon-only activity levels and goals are a guessing game when the strings already exist in `ACTIVITY_LEVELS` and `CALORIE_PRESETS`.

## Motion

- `transition-colors` for state changes. No bounce, no spring.
- `active:scale-95` on icon buttons, `active:scale-[0.97]` on nav items.
- Animate opacity and transform only.
- **Respect `prefers-reduced-motion` by gating the render, not the prop.** `AnimatedNumber`'s `animateOnMount` only sets initial state; when the value later arrives from the network it animates regardless. Home does `animate ? <AnimatedNumber/> : <span>{value}</span>`.
- View Transitions in [src/index.css](src/index.css) stay.

## Layout: the app shell

Every page is a fixed-height shell — chrome stays put, one internal region scrolls. That requires a **definite** height chain: `html`, `body` and `#root` each set `height: 100%` in [src/index.css](src/index.css), and every page root is `flex h-full flex-col overflow-hidden` with a single `flex-1 overflow-y-auto` child.

`min-height` does not make a height definite. While `html`/`body` carried only `min-height: 100dvh`, every `h-full` page root computed to `auto`, so the inner scroller never became scrollable and the App root's `overflow-hidden` clipped the overflow instead. Reported broken on Home and OMSCS; Health and Profile share the same `h-full` root and were presumably affected too, though that was not confirmed.

Do not swap these back to `min-height`, and do not reach for `h-[100dvh]` on a page root: `body` carries the safe-area inset as padding, so a viewport-unit child overflows the shell by the inset on a notched device. Finances used to do exactly that, which is why it was the one page still scrolling before the chain was fixed.

**Open question.** `html { height: 100% }` resolves against the _small_ viewport on iOS Safari, so when the toolbar collapses the shell does not grow with it. Anchoring `html` to `100dvh` instead would reintroduce a scrollable `body`, since `body { height: 100% }` would then exceed the ICB. If the bottom nav ever sits above the visual viewport bottom with the toolbar collapsed, that tradeoff is the thing to revisit.

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
- A second literal blue. Derive from `--ui-accent`.
- `min-height` on `html`/`body`/`#root`, or `h-[100dvh]` on a page root.
- Em dashes in copy (commas, colons, periods, parentheses).

## Migration status

**Migrated:** home (`HomePage`, `NutritionSummary`, `Notes`), navigation (`DynamicBottomNav`, `TopTabs`, `constants`), finances (`ExpensesView`, `TransactionCard`, `TransactionDialog`, `FinanceTracker` chrome and budget bar, `DateFilter` trigger, `Footer` border), `ProfilePage`.

**Not migrated:** login, OMSCS, the fitness views, the OMSCS and fitness dialogs, and the `DateFilter` popover — that one is still all-caps behind a migrated trigger and is the most visible remaining seam.

**Known seams inside migrated surfaces:** `DialogOverlay` in [dialog.tsx](src/components/ui/dialog.tsx) still scrims with `bg-black/50`, a raw black. Fixing it means editing the shared primitive, which would change every dialog in the app at once, so it is left for a deliberate pass. `Switch` is restyled per caller via `className` for the same reason.

Mirror the patterns above when migrating a surface, and add `.ui-surface` at the page root or `.ui-type` at the component root so the type follows.

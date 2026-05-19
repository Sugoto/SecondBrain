# DESIGN.md — SecondBrain

Editorial, monochrome, type-led. Spiritual references: Vercel (light/dev-tool minimalism) and CRED (premium dark editorial). The aesthetic spine that survives in both light and dark: oversized mono numerics, tiny tracked-out eyebrow labels, hairline rules instead of filled containers, generous vertical rhythm.

## Principles

1. **Type carries hierarchy, not chrome.** Big number + tiny eyebrow + hairline divider. No cards stacked on cards. No filled metric tiles.
2. **Color is restrained.** Tinted neutrals do the work. The indigo primary is reserved — never used as a default surface fill on the home/settings/data screens.
3. **Hairlines, not boxes.** Major sections are separated by `border-t border-outline-variant`. Field rows by `border-b border-outline-variant/60`.
4. **Mono for numerics, sans for everything else.** Every quantity uses `font-mono tabular-nums`. Names and section headings use the heading sans (`font-heading`).
5. **No filled metric containers.** Hero metrics live directly on the background. No `bg-primary-container`, no `bg-card` wrapping a number.
6. **Icons are line, not glyph.** `strokeWidth={1.5}` on header / nav icons. Avoid heavy filled icons.

## Tokens

Use the existing OKLCH tokens in [src/index.css](src/index.css). They are already tinted toward the indigo hue 275 and never pure black/white — do not introduce raw `#000`/`#fff` or `oklch(0 0 0)` / `oklch(100% 0 0)`.

| Role | Token |
|---|---|
| Page surface | `bg-background` |
| Foreground text | `text-foreground` |
| Muted text / eyebrows | `text-muted-foreground` |
| Hairline rule | `border-outline-variant` (major), `border-outline-variant/60` (field rows) |
| Inverted CTA | `bg-foreground text-background` |
| Positive signal | `text-success` (sparingly — a dot or a `+` prefix, never a fill) |
| Destructive signal | `text-destructive` (hover state on destructive icon-buttons, never a filled red pill) |

Indigo (`primary`, `primary-container`) is **not** used on metric surfaces. Reserve it for charts, links, and selection states where unavoidable.

## Typography

Set in [src/index.css](src/index.css). Default body font is Google Sans Text; headings use Google Sans Flex; numerics use Google Sans Mono with `tabular-nums`.

### Display numerics (hero metric)

```tsx
className="font-mono tabular-nums tracking-[-0.04em] text-foreground leading-[0.9] text-[clamp(44px,13vw,64px)]"
```

Use for net worth, target calories, and any other single dominant figure. One per section, never two side-by-side.

### Eyebrow label (muted)

```tsx
className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
```

Use above every metric and as the lightweight page label in headers. Hoist as a shared constant when reused on a page:

```tsx
const EYEBROW = "text-[10px] uppercase tracking-[0.22em] text-muted-foreground";
```

### Section label (foreground)

```tsx
className="text-[10px] uppercase tracking-[0.22em] text-foreground"
```

Slightly heavier than the eyebrow — used to title a settings/form section.

### Inline mono microcopy

```tsx
className="font-mono text-[11px] tabular-nums text-muted-foreground"
```

For deltas, secondary readouts (e.g. `TDEE 2400`), unit suffixes inside a metric block.

### Body and labels

- Body / field labels: `text-[13px] text-muted-foreground`
- Editorial inline names (e.g. email): `text-[20px] font-heading tracking-[-0.02em]`
- Default text size in form rows: `text-[15px]` (mono for numeric inputs, sans for everything else)

Do **not** use the M3 type roles (`text-headline-s`, `text-title-l`, etc.) on new editorial screens — they belong to the legacy M3 vocabulary. Keep them only where currently used elsewhere.

## Layout

- Page horizontal padding: `px-6` on top-level scroll surfaces.
- Section vertical padding: `pt-7 pb-8` standard; bump to `pt-10 pb-12` for the lead hero section.
- Section separators: `border-t border-outline-variant` between hairline-divided sections. The first section on the page never has a top rule.
- Never wrap a numeric metric in a card. The metric IS the section.
- Vary spacing for rhythm — don't `p-4` everything.

## Components

### Field row (settings)

A horizontal row, label on the left, control on the right, hairline below. Last row in a section omits the rule.

```tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-outline-variant/60 last:border-b-0">
      <label className="text-[13px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
```

### Number input

Borderless, right-aligned, mono. The hairline comes from the surrounding `Field`, not the input.

```tsx
<input
  type="number"
  className="font-mono tabular-nums text-right text-[15px] text-foreground bg-transparent outline-none w-32 placeholder:text-muted-foreground/40"
/>
```

### Segmented control

Hairline-bordered pill. Active segment inverts to `bg-foreground text-background`. No primary-color fill. See `Segmented` in [src/components/profile/ProfilePage.tsx](src/components/profile/ProfilePage.tsx).

### Icon button (header / inline action)

Bare. No fill, no border, no container.

```tsx
<button className="text-muted-foreground hover:text-foreground transition-colors active:scale-95">
  <Icon className="h-4 w-4" strokeWidth={1.5} />
</button>
```

A destructive icon-button uses `hover:text-destructive` — never a filled red pill.

### Primary CTA (footer save)

Full-width, inverted, sharp-ish corners, uppercase tracked label. Idle states use copy, not pill colors (`"All saved"` rather than a disabled gray button with the same label).

```tsx
<button className="w-full h-12 bg-foreground text-background text-[13px] uppercase tracking-[0.22em] rounded-lg disabled:opacity-30">
  Save changes
</button>
```

### Stat strip (sub-metrics under a hero)

A row of small mono values divided by hairlines. No outer border, no per-cell background. Used for the macro row under target calories. Pattern: `grid grid-cols-N`, each cell `border-l border-outline-variant/60` except the first.

## Motion

- `transition-colors` for state changes. No bounce, no spring.
- `active:scale-95` on icon buttons; `active:scale-[0.99]` on the CTA; `active:opacity-90` on inverted surfaces.
- Animate opacity / transform only — never layout properties.
- View Transitions (`::view-transition-*`) defined in [src/index.css](src/index.css) stay.

## Bans

- No filled metric containers (`bg-primary-container`, `bg-card`, `bg-surface-container` etc.) wrapping a hero number.
- No nested cards. A card inside a card is always wrong.
- No gradient text (`bg-clip-text`).
- No drop shadows used as elevation. Hairlines convey separation.
- No glassmorphism / backdrop blur as decoration.
- No emoji or decorative icons inside metric values.
- No em dashes in copy (use commas, colons, periods, parentheses).
- No `text-headline-*` / `text-title-*` / `text-label-*` M3 classes on new editorial screens.
- No red filled pill for sign-out — text or icon link only.
- No trailing punctuation on greeting names (`{firstName}`, not `{firstName}.`).

## Implemented reference

The vocabulary is fully realized in:

- [src/components/home/HomePage.tsx](src/components/home/HomePage.tsx) — hero metric + macro strip + hairline-separated sections
- [src/components/home/Notes.tsx](src/components/home/Notes.tsx) — bare input affordance
- [src/components/profile/ProfilePage.tsx](src/components/profile/ProfilePage.tsx) — settings as hairline-separated field rows, segmented controls, inverted CTA

Mirror these patterns when migrating other surfaces.

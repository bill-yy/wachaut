# Wachaut Design Tokens — Reference

Exact values for the design system. Source of truth: `apps/web/src/app.css`.
The app is **dark-only** — these are the only values; there is no light theme.

## Semantic color variables (`:root`)

Use these in components via `var(--name)` or the Tailwind alias `bg-[var(--name)]` / `text-[var(--name)]`.

| Variable | Value | Tailwind alias | Use for |
|----------|-------|----------------|---------|
| `--bg` | `#000000` | `bg-app` | Page background (pure black) |
| `--surface` | `#0a0a0a` | `bg-surface` | Cards, sidebars, header (near-black) |
| `--surface-2` | `#141414` | `bg-surface-2` | Insets, inputs, hover states |
| `--text` | `#fafafa` | `text-default` | Primary text |
| `--text-muted` | `#d4d4d4` | `text-muted` | Secondary text |
| `--text-subtle` | `#8c8c8c` | `text-subtle` | Tertiary text, placeholders, timestamps |
| `--border` | `#262626` | `border-subtle` | Borders, dividers |
| `--brand` | `#ffb300` | `text-brand` / `bg-brand` | **The amber accent** — links, focus, primary actions |
| `--brand-fg` | `#000000` | `brand-fg` | Text/icon color on amber backgrounds |
| `--accent` | `#ffc933` | `accent` | Lighter amber for highlights/glows |
| `--success` | `#4ade80` | `success` | Online/connected/live-OK states |
| `--warning` | `#ffb300` | `warning` | Degraded connection (shares amber) |
| `--danger` | `#f87171` | `danger` | Errors, destructive actions, LIVE badge |

`color-scheme: dark` is set on `:root`.

## Brand scale — amber (`@theme`)

Built around `#ffb300` as the 500. Use for gradients and when you need shades beyond the single `--brand` token.

| Token | Value |
|-------|-------|
| `--color-amber-50` | `#fffbeb` |
| `--color-amber-100` | `#fef3c7` |
| `--color-amber-200` | `#fde68a` |
| `--color-amber-300` | `#fcd34d` |
| `--color-amber-400` | `#ffc933` |
| `--color-amber-500` | `#ffb300` ← **brand** |
| `--color-amber-600` | `#d99400` |
| `--color-amber-700` | `#b37600` |
| `--color-amber-800` | `#805400` |
| `--color-amber-900` | `#5c3d00` |
| `--color-amber-950` | `#332100` |

> Legacy aliases `--color-indigo-*` and `--color-cyan-*` still resolve (to amber) so old component code keeps working. Prefer `--color-amber-*` in new code.

## Ink scale — near-black backgrounds

| Token | Value |
|-------|-------|
| `--color-ink-950` | `#000000` |
| `--color-ink-900` | `#050505` |
| `--color-ink-850` | `#0a0a0a` |
| `--color-ink-800` | `#101010` |
| `--color-ink-700` | `#161616` |
| `--color-ink-600` | `#1c1c1c` |

## Neutral (legacy) — `slate`

Kept intact because host/viewer pages use it directly. New code should prefer the semantic tokens above.

`slate-50 #f8fafc` → `slate-900 #0f172a` (full Tailwind slate scale).

## Typography

| Token | Stack |
|-------|-------|
| `--font-sans` | `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| `--font-display` | `'Bricolage Grotesque', 'Inter', system-ui, sans-serif` |
| `--font-mono` | `ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Code', Menlo, monospace` |

- **Display (`Bricolage Grotesque`)** → headings (`h1`–`h3`), the wordmark, large titles. Applied automatically to `h1/h2/h3` via the base layer.
- **Sans (`Inter`)** → all body text and UI. Applied on `body`.
- **Mono** → PIN codes, URLs, stats, technical values. Use Tailwind `font-mono`.
- Fonts are **self-hosted** woff2 variable fonts in `apps/web/static/fonts/` (latin + latin-ext).

Sizes use the Tailwind scale. Hero `text-5xl sm:text-7xl`, body `text-sm`, micro-labels `text-[10px]` / `text-xs`.

## Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | `0.5rem` |
| `--radius-md` | `0.75rem` |
| `--radius-lg` | `1rem` |
| `--radius-xl` | `1.25rem` |
| `--radius-2xl` | `1.5rem` |

In practice: buttons/inputs `rounded-xl`, cards `rounded-2xl`, pills/badges `rounded-full`.

## Motion

| Token | Value |
|-------|-------|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--duration-fast` | `150ms` |
| `--duration-base` | `220ms` |
| `--duration-slow` | `380ms` |

A global `@media (prefers-reduced-motion: reduce)` rule forces all animations/transitions to ~0ms. Don't fight it — design so the static end-state looks good.

## Glow shadows

| Token | Value |
|-------|-------|
| `--shadow-glow` | `0 0 0 1px rgb(255 179 0 / 0.28), 0 8px 30px -8px rgb(255 179 0 / 0.4)` |
| `--shadow-glow-strong` | `0 0 24px -2px rgb(255 179 0 / 0.55), 0 0 60px -10px rgb(255 179 0 / 0.3)` |

Utilities: `.glow-brand`, `.glow-brand-strong`. Hover states use `hover:shadow-glow` (Tailwind resolves the `@theme` token).

## Utility classes (`@layer utilities`)

| Class | Notes |
|-------|-------|
| `.btn-primary` | Amber gradient fill, white text, glow shadow. Primary CTA. |
| `.btn-secondary` | `--surface-2` fill, border, text color. Secondary action. |
| `.btn-ghost` | Transparent; hover `--surface-2`. Tertiary/icon. |
| `.btn-danger` | Translucent red fill, red text/border. Destructive. |
| `.input-field` | `--surface-2` bg, border, focus ring in `--brand`. |
| `.card` | `--surface` bg, border, hover lift. |
| `.glass` | Translucent surface + backdrop blur. Overlays, floating bars. |
| `.gradient-brand` | Amber gradient (300→500→600). Used on primary buttons, send buttons, active toggles. |
| `.text-gradient` | Amber gradient clipped to text. Headlines. |
| `.glow-brand` / `.glow-brand-strong` | Apply brand glow shadow. |

> **Specificity gotcha:** `.input-field` sets `px-4`. If you add a leading icon with `pl-10`, it may not override. For icon inputs, use explicit inline padding classes instead of `.input-field` (see `ViewerAuth.svelte`).

## Animation keyframes (global)

`float`, `pulse-slow`, `slide-up`, `fade-in`, `scale-in`, `shake` (utilities `.animate-*`), plus `floatUp`, `confettiFall`, `pulseRecord`, `celebrationPop` for reactions/celebration. The `.stagger > *` helper applies a slide-up entrance to children.

---
name: wachaut-design-system
description: How to build UI for the Wachaut screen-sharing app using its design system. Use whenever adding, editing, or reviewing components, pages, styles, or assets in apps/web — even if the user just says "add a button" or "make a card". Also use when asked to keep the UI consistent, on-brand, or matching the existing look.
---

# Wachaut Design System

Wachaut is a screen-sharing web app. Its frontend lives in `apps/web/` and uses **SvelteKit + Svelte 5 (runes) + Tailwind CSS v4 + lucide-svelte**. This skill documents the design system so every piece of UI stays consistent.

## The look in one line

**Premium black with amber gold.** Deep near-black surfaces, a single amber accent (`#ffb300`), gold glows, expressive display type. **Dark-only** — there is no light theme and no theme toggle.

## Stack & conventions

- **Svelte 5 runes** (`$state`, `$derived`, `$effect`, `$bindable`, `$props`). Never use the deprecated `<slot>` or `<svelte:component>`.
- **Tailwind v4** configured in CSS (`apps/web/src/app.css`) — there is no `tailwind.config.js`. Theme tokens live in `@theme {}` and `@theme inline {}`.
- **Icons:** import from `lucide-svelte`. Icon-only buttons must have an `aria-label`.
- **Color via semantic CSS variables**, not raw hex. Write `bg-[var(--surface)]`, `text-[var(--text-muted)]`, `border-[var(--border)]`, `text-[var(--brand)]` — never hardcode `#000` or `#ffb300` in component markup.
- **Fonts are self-hosted** (woff2 in `apps/web/static/fonts/`). Don't add Google Fonts `<link>`s.
- **TypeScript for new files.** The two room pages (`room/+page.svelte`, `room/[roomId]/+page.svelte`) are `.svelte` with `<script lang="ts">`.

## Golden rules

1. **Always use the existing components** before writing new markup. Check the component list below.
2. **Use semantic color tokens** (`var(--brand)`, `var(--surface)`, etc.), not raw hex. The only place raw amber hex belongs is `app.css` and the brand SVG assets.
3. **Dark-only.** Do not add light-mode values, `.dark` class switching, `prefers-color-scheme` branches, or theme toggles. The whole app is dark.
4. **Accessibility is non-negotiable:** `aria-label` on icon buttons, `role="dialog"`+focus trap on modals, `focus-visible` rings (handled by base styles), and respect `prefers-reduced-motion` (the global `@media` rule already disables non-essential animation).
5. **Buttons get `class="btn-primary|btn-secondary|btn-ghost|btn-danger"`** (or use the `<Button>` component). Inputs get `class="input-field"`. Cards use `<Card>`.
6. **Motion** uses the standard easings (`--ease-out-soft`, `--ease-spring`) and durations (`--duration-fast/base/slow`).

## Component library

All components live in `apps/web/src/lib/components/`. Import via `$lib/components/<Name>.svelte`.

**Base (reusable anywhere):**
- `Button` — variants `primary|secondary|ghost|danger`, sizes `sm|md|lg`, `loading`. Renders `<button>`.
- `IconButton` — icon-only button; **requires `label` prop** (becomes `aria-label`).
- `Input` — text input with optional `label`, `hint`, `error`, `leading` icon snippet; supports `bind:value`.
- `Card` — surface container; `interactive` (hover lift + glow), `glass` (translucent).
- `Modal` — dialog with focus trap, ESC, backdrop click, scroll-lock. Props: `open`, `label`, `title`, `size`, `onClose`.
- `Badge` — small tag; tones `neutral|brand|success|warning|danger`.
- `Pill` — status chip with animated dot; tones `success|warning|danger|brand|neutral`; `pulse` for live indicators.
- `Spinner`, `Tooltip`, `Divider` — small utilities.
- `Brand` — the logo mark + "wachaut" wordmark. Use `<Brand size="sm|md|lg" />`.
- `Toaster` — global toast renderer (mounted once in `+layout.svelte`). Push via `toast.success/error/info/warning(msg)` from `$lib/stores/toast.svelte`.

**Screen-sharing specific:**
- `VideoStage` / `ViewerVideoStage` — `<video>` + floating controls.
- `ChatPanel` / `ViewerChatPanel` — chat messages + input.
- `EmotePicker` — favorites row + expandable emoji grid.
- `ReactionLayer` — floating reactions + confetti celebration.
- `HostHeader` / `ViewerHeader` — top bars.
- `RoomSidebar` — host's PIN/URL/quality/chat sidebar.
- `QualitySettings`, `ViewersPanel`, `ViewerAuth`, `ViewerStatus` — feature panels.

## Shared utilities (`apps/web/src/lib/`)

- `utils/cn.ts` — `cn(...classes)` joins truthy class strings.
- `utils/emotes.ts` — `EMOTE_CATEGORIES`, `ALL_EMOTES`, `loadFavorites`, `trackFavorite`.
- `utils/chat.ts` — `ChatMessage` type, `systemMessage()`, `formatChatTime()`, `SENDER_HOST`/`SENDER_SYSTEM`.
- `utils/format.ts` — `formatDuration(seconds)`.
- `utils/clipboard.ts` — `copyText(text)` with non-secure-context fallback.
- `utils/motion.ts` — `prefersReducedMotion()`, `motionDuration(ms)`.
- `actions.ts` — `clickOutside(callback)` and `focusTrap` (Svelte actions).
- `stores/toast.svelte.ts` — the toast queue (runes-based).
- `types/room.ts` — `Viewer`, `FloatingReaction`, `ConfettiParticle`.

## Brand assets

Live in `apps/web/static/`:
- `favicon.svg` — amber-background mark (inverted for tab visibility).
- `brand-marks/mark.svg`, `apple-touch-icon.svg`, `og.svg`.

When changing the brand color, update **all** of these plus the `--color-amber-*` scale and semantic `--brand` in `app.css` together.

## Detailed reference

For the full token tables (exact hex values, the complete amber/ink scales, typography sizes, spacing, the utility-class definitions), read **`references/tokens.md`** in this skill directory before writing or editing styles.

## When building a new screen

1. Read `references/tokens.md` for exact values.
2. Skim the closest existing component (e.g., a panel or header) and match its structure and class patterns.
3. Compose from the base components; only drop to raw `<div>` + utility classes when no component fits.
4. Verify with `pnpm --filter web check` (svelte-check) and `pnpm --filter web build` — both must pass with no new errors.

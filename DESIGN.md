# Design

## Theme

One consistent product identity across every surface (popup, options, and the on-page launcher),
crisp and fully opaque (no glassmorphism). Neutral graphite carries the UI; a single electric-blue
accent is reserved for action, current selection, the focus ring, and the raven/enhance marks. Blue
is never used as a surface tint.

Dark is the default; light follows `prefers-color-scheme`. (The earlier "warm ember & ink" identity
and the per-host chameleon launcher were removed on 2026-06-07.)

## Color

All tokens are RGB channel triples behind CSS variables (`rgb(var(--mn-x) / <alpha>)`), declared on
`:root` (popup / options documents) and `:host` (the content-script Shadow DOM) so they resolve in
every context.

| Role | Dark (default) | Light |
| --- | --- | --- |
| bg | `#171717` | `#ffffff` |
| surface | `#262626` | `#ffffff` |
| surface-2 | `#303030` | `#f3f4f6` |
| border | `#404040` | `#e5e7eb` |
| text | `#e5e5e5` | `#333333` |
| muted | `#a3a3a3` | `#6b7280` |
| accent | `#3b82f6` | `#3b82f6` |
| accent-ink (text on accent) | `#ffffff` | `#ffffff` |
| danger | `#ef4444` | `#ef4444` |

Source: a provided shadcn-style token set, adopted verbatim at the user's direction. In light mode
`surface` equals `bg` (white), so cards and panels read by their 1px border rather than a fill.

> **Accessibility note.** White text on the `#3b82f6` accent fill is ~3.7:1, just under the WCAG AA
> 4.5:1 bar for small text. It is kept because these are the user's chosen tokens; darkening the
> button fill to `#2563eb` clears AA if stricter contrast is wanted later.

## Typography

- **Body / UI and display:** the native system sans stack (`system-ui, -apple-system, 'Segoe UI',
  Roboto, 'Helvetica Neue', sans-serif`). The display role (`.mn-display`, used for the wordmark and
  card titles) is the same sans with tighter tracking, not a serif. System fonts only, no web-font
  CDN (privacy), and no generic "Inter" tell. The provided theme's Inter / JetBrains / Source Serif
  names are intentionally not loaded.
- Scale (rem): 2xs .6875 / xs .75 / sm .8125 / base .875 / lg 1 / xl 1.25.

## Components

Crisp surfaces: 1px solid `border`, opaque `surface`, soft single-layer neutral shadow (no
blur-glass). Radius is driven by one token, `--mn-radius` (8px): Tailwind maps `lg`/`xl` ≈ 8px and
`2xl` ≈ 11px. Every interactive control ships default / hover / focus / active / disabled states.
Empty states teach. Custom controls (segmented, toggle, tabs) keep native semantics (radiogroup /
switch / tab) and visible focus rings.

**Restraint.** Group by whitespace first; prefer a single hairline divider (`border-t`) over
wrapping each item in its own box (Options is one container with dividers, not nested panels). At
most one panel per surface, never nested. The blue accent is reserved for the primary action,
current selection, the focus ring, and the raven/enhance marks; tags and card-hover are neutral (no
accent tint). UI copy carries no em dashes.

**Icons.** Single-color inline SVG (inherit `currentColor`), consistent ~1.7–2.0 stroke. The raven
(memory) and an upward double-chevron (enhance) are the dock marks; the popup settings control is a
sliders glyph. Deliberately no sparkle / "magic" glyphs (they read as generic AI).

## Layout

Popup 380×560 fixed. Options centered, max-w ~42rem. Launcher: a fixed **row** of round buttons
(raven + enhance) that auto-anchors just **above** the host composer, right-aligned to its right
edge, and tracks it on scroll/resize (not draggable, no persisted position). The opaque panel
(320 wide, height capped to the room above) opens **above** the dock, bottom-anchored so a short
panel hugs the dock instead of floating. Per-site offset is tunable (`COMPOSER_GAP`) since each
composer's internal padding differs. Responsive behavior is structural, not fluid type.

> **Shadow-DOM note.** The launcher mounts in a shadow root with no `<body>`, and its host element
> carries `all: initial` (which resets font/color to the UA serif default). A `.mn-root` base rule
> sets the font and text color on the mount element so the panel and its form controls inherit the
> system sans.

## Capture

The memory panel offers three explicit, labelled capture actions, shown as a row of equal secondary
buttons under the search field: **Selection**, **Last message**, and **Full chat** (the whole
visible thread). Selection is disabled, with a reason, when nothing is selected; an unreadable full
chat shows a helpful inline message and saves nothing. Every action opens an editable preview (title
/ body / tags) before the card is created, with a sensible default title (e.g. `Full chat · ChatGPT
· Jun 7`). The form scrolls with a pinned Cancel / Save action bar so Save is always reachable.
Capture is always an explicit click.

## Motion

150–200ms, ease-out, no bounce. Used for: state change, hover/press feedback, panel open, and a
subtle list stagger on first paint of the card list (≤40ms step). Full `prefers-reduced-motion`
fallbacks (crossfade / instant). No page-load choreography.

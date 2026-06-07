# Design

## Theme

Two-faced product theme, both crisp and fully opaque (no glassmorphism).

- **Muninn's own surfaces** (popup, options): *warm ink & ember*. Deep warm-charcoal/umber
  near-black in dark mode; a true near-white (faint warm tint, chroma ≤0.006, not cream) in light
  mode. A single ember/amber accent carries primary actions, selection, and the raven motif.
- **On-page launcher** (content script): *adaptive / chameleon*. Reads the host AI and swaps its
  whole palette to match, so it feels first-party. Dark-first, with a light variant per host via
  `prefers-color-scheme`.

Color uses OKLCH. Dark is the default; light follows `prefers-color-scheme`.

## Color

All tokens are RGB channel triples behind CSS variables (`rgb(var(--mn-x) / <alpha>)`).

### Muninn identity (popup + options)
| Role | Dark (default) | Light |
| --- | --- | --- |
| bg | warm near-black `oklch(0.175 0.014 48)` | warm off-white `oklch(0.975 0.005 70)` |
| surface | `oklch(0.215 0.015 48)` | `oklch(1 0 0)` |
| surface-2 | `oklch(0.265 0.016 48)` | `oklch(0.965 0.006 70)` |
| border | `oklch(0.32 0.018 48)` | `oklch(0.90 0.008 70)` |
| ink (text) | parchment `oklch(0.93 0.014 75)` | warm ink `oklch(0.22 0.02 45)` |
| muted | `oklch(0.70 0.022 60)` | `oklch(0.50 0.022 50)` |
| accent (ember) | `oklch(0.74 0.155 62)` | `oklch(0.62 0.16 50)` |
| accent-ink (text on accent) | `oklch(0.20 0.03 45)` | `oklch(0.99 0.01 70)` |
| danger | `oklch(0.66 0.18 28)` | `oklch(0.55 0.19 28)` |

Strategy: **Committed-leaning-Restrained.** The ember accent is used with intent (primary action,
current selection, the raven, the wordmark glyph). Warm-ink neutrals do the heavy lifting.

### Per-site launcher palettes (accent / surface / ink, dark + light)
- **Claude** — clay accent `oklch(0.64 0.13 42)`; ivory surface `oklch(0.96 0.012 80)` (light) /
  warm dark `oklch(0.21 0.012 50)`; serif accent type. Mirrors Claude's paper-and-bookcloth feel.
- **ChatGPT** — monochrome: accent is high-contrast ink (near-black light / near-white dark);
  neutral graphite surfaces `oklch(0.985 0 0)` / `oklch(0.205 0.004 250)`. Matches its minimal B/W.
- **Gemini** — blue→violet accent `oklch(0.58 0.17 275)`; clean white / cool dark
  `oklch(0.20 0.01 265)`. Matches Google's Gemini identity.

## Typography

- **Body / UI:** `Inter`, system-ui sans stack. Fixed rem scale (product register), ratio ~1.2.
- **Display / wordmark + card titles:** a system serif stack (`ui-serif, Georgia, 'Iowan Old
  Style', serif`) for the literate, raven/memory gravity. Self-hosted/system only (no web-font CDN,
  privacy). Cap families at 2 (serif display + sans body); mono not needed.
- Scale (rem): 2xs .6875 / xs .75 / sm .8125 / base .875 / lg 1 / xl 1.25 / 2xl 1.5.
- `text-wrap: balance` on headings.

## Components

Crisp surfaces: 1px solid `border`, opaque `surface`, soft single-layer shadow (no blur-glass).
Radius scale: sm 8px / base 12px / lg 16px. Every interactive control ships default / hover / focus
/ active / disabled states. Empty states teach. Custom controls (segmented, toggle, tabs) keep
native semantics (radiogroup / switch / tab) and visible focus rings.

## Layout

Popup 380×560 fixed. Options centered max-w ~42rem. Launcher: draggable button → opaque panel
(320×420), positioned clear of the host send button. Responsive behavior is structural, not fluid
type.

## Motion

150–200ms, ease-out (quart/expo), no bounce. Used for: state change, hover/press feedback, panel
open, list stagger on first paint of the card list (subtle, ≤40ms step). Full
`prefers-reduced-motion` fallbacks (crossfade / instant). No page-load choreography.

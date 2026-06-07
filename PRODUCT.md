# Product

## Register

product

## Users
People who live in AI chat tools (Claude, ChatGPT, Gemini) all day and are tired of re-pasting the
same context and hand-tuning the same rough prompts. They are fluent power users: keyboard-first,
privacy-conscious, allergic to bloated "AI productivity" extensions. Their context when using Muninn
is mid-task, inside a conversation, not wanting to break flow.

## Product Purpose
Muninn is a fully client-side memory layer for AI chats. It does exactly two things: store reusable
context "cards" you inject into the chat input, and upgrade a rough prompt (locally and offline, or
via the user's own API key). Success = it feels like a native capability of whatever AI you're in,
saves real keystrokes, and never asks the user to trust a server, because there isn't one.

## Brand Personality
Warm, literate, quietly confident. The name is Norse (Odin's raven of Memory), so the identity
leans into ember-and-ink warmth and a touch of editorial gravity, not cold dev-tool minimalism.
Three words: **warm, precise, native**. It should feel like a well-made object, and on a host AI
site it should feel like it shipped with the AI.

## Anti-references
- The "same boring tool design" lane: Linear/Notion/Raycast clones, monochrome-graphite-and-one-blue
  SaaS, the cream-and-serif "editorial restraint" template. Familiar-but-soulless.
- Generic SaaS / Bootstrap default-blue buttons and flat identical card grids.
- Neon cyberpunk gradients, glassmorphism-everywhere, gradient text.
- Anything that screams "third-party browser extension bolted onto the page."

## Design Principles
1. **Be a native, not a guest.** On a host AI site the launcher adopts that AI's own palette and
   shape so it reads as a first-party feature. Muninn's own surfaces (popup, options) carry its own
   warm identity.
2. **Warmth as signature, not as default.** Warm comes from a committed ember accent and warm-ink
   neutrals, never from a beige/cream body bg (the saturated AI tell).
3. **Disappear into the task.** Crisp, opaque, dense, fast. Motion conveys state only.
4. **Earned familiarity for affordances, surprise reserved for identity.** Standard controls behave
   exactly as expected; personality lives in color, the raven motif, and small moments.
5. **Privacy is visible.** Everything is local; the design never implies a backend.

## Accessibility & Inclusion
WCAG 2.1 AA: body text ≥4.5:1, large text/UI ≥3:1, visible focus rings on every interactive element,
full keyboard navigation, ARIA roles on custom controls. Honor `prefers-color-scheme` (dark-first +
light) and `prefers-reduced-motion`. Per-site launcher themes are contrast-checked in both modes.

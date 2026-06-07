# Muninn

> Memory for your AI chats. Save reusable context, and upgrade rough prompts — all client-side.

Muninn is a Manifest V3 Chrome extension named after one of Odin's ravens, whose name means
*"Memory."* It does two things, and nothing else:

1. **Muninn Memory** — save reusable blocks of context as **cards** and inject them into any AI
   chat input with one click.
2. **Prompt Upgrade** — turn a rough prompt into a refined one, either fully offline or via your
   own API key.

There is **no backend, no analytics, and no remote configuration**. The only network requests
Muninn ever makes are the ones *you* trigger to *your* chosen LLM provider.

---

## Features

### Memory (context cards)
- Create, edit, pin, delete, and fuzzy-search cards (search matches title + tags).
- Markdown bodies, stored raw with a live preview.
- Pinned cards always sort to the top.
- An on-page **launcher** on the four supported sites: a small draggable, collapsible raven button
  that expands into a card panel. Click a card to **append** its body into the chat input (it never
  overwrites what you've typed). The launcher remembers its position per-site.
  - **Adaptive theming:** the launcher adopts the host AI's own palette so it reads as a native,
    first-party feature, not a bolted-on extension — warm clay on Claude, monochrome graphite on
    ChatGPT, blue→violet on Gemini. Muninn's own popup and options carry its "warm ink & ember"
    identity. See [DESIGN.md](./DESIGN.md).
- **Capture** (always an explicit click): grab your current text selection — or the last message if
  nothing is selected — straight into a new card. Muninn never auto-captures or logs conversations.
- Optional **context template** (on by default, fully editable) that wraps injected cards so the
  model acknowledges the context before acting.

### Prompt Upgrade
Shared controls: **tone** (Auto / Business / Creative / Technical) and **revision strength**
(Conservative / Balanced / Radical).

- **Local mode** — a deterministic, offline pipeline of small rules. It adds a persona line when
  none exists, requests an output format when none is detected, and expands terse prompts with a
  specificity clause. *Conservative* = persona + format; *Balanced* = + specificity; *Radical* =
  + full constraint scaffolding. **This mode never makes a network call.**
- **Bring-your-own-key (BYOK) mode** — calls your chosen provider (**Anthropic** or **OpenAI**)
  directly with your key, streaming the response. Providers are config entries, so adding more is
  trivial.

---

## Supported sites
The on-page launcher and capture run **only** on:
`claude.ai`, `chatgpt.com`, `chat.openai.com`, and `gemini.google.com`.

Each site's input logic is isolated in its own small adapter (`src/content/adapters/`). When a
selector breaks (these DOMs change without notice), the launcher hides itself quietly — it never
throws and never breaks the host page.

---

## Install (development)

```bash
npm install
npm run build      # type-check + production build into dist/
```

Then in Chrome:
1. Go to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist/` folder.

For live development with HMR:
```bash
npm run dev
```
and load the generated `dist/` (CRXJS rebuilds on change).

### Using BYOK
Open **Options** (gear icon in the popup), pick a provider, paste your API key, and click **Save**.
Muninn will request permission to contact that one API host at that point — not before. Your key is
stored only in `chrome.storage.local`.

> Note: Anthropic browser calls include the `anthropic-dangerous-direct-browser-access` header,
> which is how Anthropic permits direct calls from a browser extension. There is no Muninn proxy —
> the request goes straight from your browser to Anthropic.

---

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Vite + CRXJS dev build with HMR |
| `npm run build` | Type-check then production build to `dist/` |
| `npm test` | Run the Vitest unit suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | Type-check only |

---

## Project layout
```
src/
  lib/            Pure, testable core: storage, cards, search, template, prompt engine
    prompt/local/   Offline rule pipeline (Mode A)
    prompt/providers/  Provider configs (Anthropic, OpenAI) + BYOK caller (Mode B)
  content/        Content script: Shadow-DOM launcher + per-site adapters
  popup/          Toolbar popup (Memory + Upgrade tabs)
  options/        Options / data-control page
  ui/             Shared components, theme tokens, hooks, the raven mark
  test/           Vitest setup (in-memory chrome.storage mock)
```

## Tech
React 18 · TypeScript · Tailwind CSS · Vite + CRXJS (Manifest V3) · Vitest.

## Tests
`npm test` covers the local prompt-upgrade rules, the card logic, fuzzy search, the storage layer
(including export/import/wipe and migrations), template wrapping, and the provider request builders.

## Permissions, briefly
- `storage` — the only data store (cards, settings, the local API key).
- `activeTab` + `scripting` — to insert text into the tab you're looking at, on click.
- host permissions for the four AI sites — where the launcher runs.
- `optional_host_permissions` for the two provider API hosts — requested at runtime only if you use
  BYOK.

No `<all_urls>`. No broad `tabs`. See [PRIVACY.md](./PRIVACY.md) for the full data story.

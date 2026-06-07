# Muninn — Privacy Policy

_Last updated: 2026-06-06_

Muninn is built to be private by default. It is a fully client-side extension. This document
describes **exactly** what is stored, where, and what leaves your device.

## Short version
- Everything you create stays on your device in `chrome.storage.local`.
- Muninn has **no servers, no analytics, no telemetry, and no remote configuration.**
- The **only** network requests Muninn makes are the prompt-upgrade calls **you** explicitly
  trigger in BYOK mode — sent directly to the LLM provider you chose, using your own API key.
- There is **no usage or token counter**, and **no automatic capture or logging** of your
  conversations. Capture only happens when you click the Capture button.

## What is stored, and where
All data lives in **`chrome.storage.local`** on the device. Nothing is stored in
`chrome.storage.sync`, so it is never replicated to your Google account or other devices.

| Key | Contents |
| --- | --- |
| `muninn.schemaVersion` | A number used for future data migrations. |
| `muninn.cards` | Your context cards: title, body (raw markdown), tags, timestamps, pinned flag, and whether the card was typed manually or captured. |
| `muninn.settings` | Your provider choice, model, **API key**, default tone/strength, and the injection template + toggle. |
| `muninn.launcherPos` | The on-page launcher's position, per supported site. |

### Your API key
- Stored **only** in `chrome.storage.local` — never in `chrome.storage.sync`.
- **Masked** in the Options UI (shown only if you click "Show").
- **Never written to logs or error messages.** Error text from a provider is scrubbed of the key
  before it is ever displayed.
- Sent **only** to the provider you selected, **only** when you run a BYOK prompt upgrade.

## Network activity
| When | Where | Why |
| --- | --- | --- |
| You run **Local** prompt upgrade | Nowhere — it runs entirely in the browser | No network call is possible in this mode. |
| You run **BYOK** prompt upgrade | Directly to `api.anthropic.com` or `api.openai.com` (whichever you chose) | To rewrite your prompt with your own key. |

Muninn requests permission to contact a provider's API host **only when you save a key / first use
BYOK** — via `optional_host_permissions`. If you never use BYOK, that permission is never granted.

There are no other outbound requests of any kind.

## What Muninn does **not** do
- It does **not** read, store, or transmit your conversations.
- It does **not** auto-capture, scrape, or background-log page content. Capturing text is always a
  manual, explicit click, and the captured text only ever populates a new-card form locally.
- It does **not** track usage, count tokens, or collect analytics.
- It does **not** request broad permissions (`<all_urls>` or general `tabs` access). The content
  script runs only on `claude.ai`, `chatgpt.com`, `chat.openai.com`, and `gemini.google.com`.

## Your control over your data
From the Options page you can:
- **Export** all Muninn data to a JSON file (this includes your API key, so treat the file as a
  secret).
- **Import** data from such a file (replaces current data).
- **Wipe all data**, which clears everything Muninn has stored on the device.

## Third parties
When you use BYOK mode, your prompt is sent to the provider you chose (Anthropic or OpenAI). Their
handling of that request is governed by **their** privacy policy and terms — Muninn is not involved
beyond making the direct request you asked for.

## Contact
Muninn is an open, client-side tool with no data collection. Questions about the code or its
behavior are best answered by reading the source in this repository.

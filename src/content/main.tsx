// Content-script entry for the four supported AI sites. Mounts the launcher
// inside a Shadow DOM (so Muninn styles never leak into — or inherit from —
// the host page) and answers "insert" messages from the popup. If no adapter
// matches or the site DOM isn't ready, it does nothing and stays silent.
//
// Robustness: when the extension is reloaded/updated, this (now-orphaned)
// content script's chrome.* calls — and CRXJS's own module loader — can throw
// "Extension context invalidated". We (a) suppress exactly that error so it
// never surfaces on the host page, and (b) tear ourselves down so we stop
// doing work. A page refresh then loads a fresh, valid instance.

import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
// `?inline` gives us the compiled CSS as a string so we can place it INSIDE the
// shadow root instead of letting it leak into the page <head>.
import styles from '../ui/theme.css?inline';
import { selectAdapter, safeAdapter } from './adapters';
import { insertText } from './insert';
import { Launcher } from './Launcher';
import type { Message, InsertResult } from '../lib/messaging';

const INVALIDATED = 'Extension context invalidated';

function isInvalidationError(reason: unknown): boolean {
  const msg =
    typeof reason === 'string'
      ? reason
      : reason instanceof Error
        ? reason.message
        : (reason as { message?: string })?.message ?? '';
  return msg.includes(INVALIDATED) || msg.includes('context invalidated');
}

// Swallow context-invalidation errors from our own (orphaned) script so they
// never show up as uncaught errors / rejections on the host page.
window.addEventListener('error', (e) => {
  if (isInvalidationError(e.error ?? e.message)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});
window.addEventListener('unhandledrejection', (e) => {
  if (isInvalidationError(e.reason)) {
    e.preventDefault();
  }
});

function extensionAlive(): boolean {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
}

function mount() {
  const base = selectAdapter();
  if (!base) return;
  const adapter = safeAdapter(base);

  // Respond to the popup's "insert into page" requests using the same adapter.
  try {
    chrome.runtime.onMessage.addListener(
      (msg: Message, _sender, sendResponse: (r: InsertResult) => void) => {
        if (msg?.type === 'muninn:insert') {
          try {
            sendResponse(insertText(adapter, msg.text));
          } catch {
            sendResponse({ ok: false, reason: 'Insert failed.' });
          }
        }
        return true; // keep the message channel open for the async response
      },
    );
  } catch {
    /* context already gone */
  }

  // Mount the launcher in an isolated shadow root.
  const host = document.createElement('div');
  host.id = 'muninn-launcher-root';
  // Defensive: keep the host element out of layout flow.
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = styles;
  shadow.appendChild(style);

  const mountEl = document.createElement('div');
  mountEl.className = 'mn-root';
  shadow.appendChild(mountEl);
  document.body.appendChild(host);

  let root: Root | null = createRoot(mountEl);
  root.render(
    <StrictMode>
      <Launcher adapter={adapter} />
    </StrictMode>,
  );

  // Watchdog: once our extension context is gone (reload/update/disable),
  // unmount and remove ourselves so no further chrome.* calls run.
  const watchdog = window.setInterval(() => {
    if (extensionAlive()) return;
    window.clearInterval(watchdog);
    try {
      root?.unmount();
    } catch {
      /* ignore */
    }
    root = null;
    host.remove();
  }, 1000);
}

try {
  mount();
} catch (e) {
  if (!isInvalidationError(e)) throw e;
}

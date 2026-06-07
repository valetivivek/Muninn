// gemini.google.com adapter. The composer is a contenteditable rich-textarea
// (Angular component) — typically div.ql-editor inside <rich-textarea>.

import {
  type SiteAdapter,
  setContentEditableText,
  readContentEditableText,
} from './types';

export const geminiAdapter: SiteAdapter = {
  id: 'gemini',
  matches: (host) => host.endsWith('gemini.google.com'),

  findInput() {
    return (
      document.querySelector<HTMLElement>('rich-textarea div.ql-editor[contenteditable="true"]') ??
      document.querySelector<HTMLElement>('div.ql-editor[contenteditable="true"]') ??
      document.querySelector<HTMLElement>('div[contenteditable="true"]')
    );
  },

  readText(input) {
    return readContentEditableText(input);
  },

  setText(input, text) {
    setContentEditableText(input, text);
  },

  findAnchor() {
    return this.findInput()?.closest('input-area, form, .input-area-container') ?? this.findInput();
  },

  findSendButton() {
    return (
      document.querySelector<HTMLElement>('button[aria-label*="Send" i]') ??
      document.querySelector<HTMLElement>('button.send-button')
    );
  },

  lastMessageText() {
    const nodes = document.querySelectorAll<HTMLElement>(
      'message-content, .model-response-text, .query-text, .markdown',
    );
    for (let i = nodes.length - 1; i >= 0; i--) {
      const t = (nodes[i].innerText ?? '').trim();
      if (t) return t;
    }
    return '';
  },

  conversationText() {
    const USER_SEL = 'user-query, .query-text';
    const ASSISTANT_SEL = 'model-response, .model-response-text, message-content';
    // One query keeps user/model turns in document order; classify each node.
    // The selectors can nest (e.g. .query-text inside <user-query>); prefer the
    // innermost match so we capture clean turn text, not surrounding UI chrome.
    let nodes = document.querySelectorAll<HTMLElement>(`${USER_SEL}, ${ASSISTANT_SEL}`);
    if (!nodes.length) nodes = document.querySelectorAll<HTMLElement>('.markdown');

    const all = Array.from(nodes);
    const parts: string[] = [];
    all.forEach((node) => {
      if (all.some((other) => other !== node && node.contains(other))) return;
      const text = (node.innerText ?? node.textContent ?? '').trim();
      if (!text) return;
      const label = node.matches(USER_SEL)
        ? 'You:'
        : node.matches(ASSISTANT_SEL)
          ? 'Gemini:'
          : '';
      parts.push(label ? `${label}\n${text}` : text);
    });
    return parts.join('\n\n');
  },
};

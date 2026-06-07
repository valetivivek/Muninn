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
};

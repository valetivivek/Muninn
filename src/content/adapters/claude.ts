// claude.ai adapter. The composer is a ProseMirror contenteditable.

import {
  type SiteAdapter,
  setContentEditableText,
  readContentEditableText,
} from './types';

export const claudeAdapter: SiteAdapter = {
  id: 'claude',
  matches: (host) => host.endsWith('claude.ai'),

  findInput() {
    return (
      document.querySelector<HTMLElement>('div[contenteditable="true"].ProseMirror') ??
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
    return this.findInput()?.closest('div[class*="composer"], fieldset, form') ?? this.findInput();
  },

  findSendButton() {
    return (
      document.querySelector<HTMLElement>('button[aria-label*="Send" i]') ??
      document.querySelector<HTMLElement>('button[type="submit"]')
    );
  },

  lastMessageText() {
    const nodes = document.querySelectorAll<HTMLElement>(
      '.font-claude-message, .font-claude-response, [data-testid="user-message"], [data-testid*="message"]',
    );
    for (let i = nodes.length - 1; i >= 0; i--) {
      const t = (nodes[i].innerText ?? '').trim();
      if (t) return t;
    }
    return '';
  },

  conversationText() {
    const USER_SEL = '[data-testid="user-message"]';
    const ASSISTANT_SEL = '.font-claude-message, .font-claude-response';
    // Pull both roles in one query so turns stay in document order; classify
    // each node afterwards. Fall back to any *message* node (roles unknown).
    let nodes = document.querySelectorAll<HTMLElement>(`${USER_SEL}, ${ASSISTANT_SEL}`);
    if (!nodes.length) nodes = document.querySelectorAll<HTMLElement>('[data-testid*="message"]');

    const parts: string[] = [];
    nodes.forEach((node) => {
      const text = (node.innerText ?? node.textContent ?? '').trim();
      if (!text) return;
      const label = node.matches(USER_SEL)
        ? 'You:'
        : node.matches(ASSISTANT_SEL)
          ? 'Claude:'
          : '';
      parts.push(label ? `${label}\n${text}` : text);
    });
    return parts.join('\n\n');
  },
};

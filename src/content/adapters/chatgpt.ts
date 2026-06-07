// ChatGPT adapter — covers both chatgpt.com and chat.openai.com. The composer
// is a contenteditable (#prompt-textarea) in current builds; older builds used
// a real <textarea>, which we still support.

import {
  type SiteAdapter,
  setContentEditableText,
  readContentEditableText,
  setTextareaValue,
} from './types';

export const chatgptAdapter: SiteAdapter = {
  id: 'chatgpt',
  matches: (host) => host.endsWith('chatgpt.com') || host.endsWith('chat.openai.com'),

  findInput() {
    return (
      document.querySelector<HTMLElement>('div[contenteditable="true"]#prompt-textarea') ??
      document.querySelector<HTMLElement>('#prompt-textarea') ??
      document.querySelector<HTMLElement>('textarea[data-id], main textarea')
    );
  },

  readText(input) {
    if (input instanceof HTMLTextAreaElement) return input.value;
    return readContentEditableText(input);
  },

  setText(input, text) {
    if (input instanceof HTMLTextAreaElement) setTextareaValue(input, text);
    else setContentEditableText(input, text);
  },

  findAnchor() {
    return this.findInput()?.closest('form') ?? this.findInput();
  },

  findSendButton() {
    return (
      document.querySelector<HTMLElement>('button[data-testid="send-button"]') ??
      document.querySelector<HTMLElement>('button[aria-label*="Send" i]')
    );
  },

  lastMessageText() {
    const nodes = document.querySelectorAll<HTMLElement>(
      '[data-message-author-role], article [data-testid="conversation-turn"], .markdown.prose',
    );
    for (let i = nodes.length - 1; i >= 0; i--) {
      const t = (nodes[i].innerText ?? '').trim();
      if (t) return t;
    }
    return '';
  },
};

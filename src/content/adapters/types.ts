// One adapter per supported site, all exposing this identical interface. Site
// DOMs change without notice, so each method is allowed to return null/throw
// internally — the caller (see ./index.ts safeAdapter) wraps every call so a
// broken selector fails quietly and hides the launcher rather than throwing.

export interface SiteAdapter {
  /** Stable id for logging / per-site storage keys. */
  id: string;
  /** True if this adapter handles the given hostname. */
  matches(hostname: string): boolean;
  /** Find the chat input element (textarea or contenteditable), or null. */
  findInput(): HTMLElement | null;
  /** Read the current text of the input. */
  readText(input: HTMLElement): string;
  /** Replace the input's text and fire the events the site needs to react. */
  setText(input: HTMLElement, text: string): void;
  /** An element near the input used to anchor the floating launcher. */
  findAnchor(): HTMLElement | null;
  /** The site's send button, so the launcher can avoid covering it. */
  findSendButton(): HTMLElement | null;
  /** Text of the most recent message, for capture when nothing is selected. */
  lastMessageText(): string;
}

/** Helper: set a textarea's value via the native setter so React/Vue notice. */
export function setTextareaValue(el: HTMLTextAreaElement, text: string): void {
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, text);
  else el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Helper: set a contenteditable's text and notify the host framework. */
export function setContentEditableText(el: HTMLElement, text: string): void {
  el.focus();
  // Replace content with paragraphs so newlines survive in rich editors.
  const html = text
    .split('\n')
    .map((line) => `<p>${escapeHtml(line) || '<br>'}</p>`)
    .join('');
  el.innerHTML = html;
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}

export function readContentEditableText(el: HTMLElement): string {
  return (el.innerText ?? el.textContent ?? '').replace(/ /g, ' ');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

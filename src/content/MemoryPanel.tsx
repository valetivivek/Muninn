// Muninn's memory panel: search, the card list, and capture-into-a-card. Opened
// from the raven button in the on-page dock. Clicking a card injects its
// (optionally template-wrapped) body into the composer. Capture offers three
// explicit sources (your selection, the last message, or the full chat) and
// always previews what will be saved before creating the card. Capture is
// always an explicit click and can be turned off in Options.

import { useEffect, useState, type MutableRefObject } from 'react';
import type { Card } from '../lib/types';
import type { SiteAdapter } from './adapters/types';
import { searchCards } from '../lib/cards';
import { wrapBody } from '../lib/template';
import { Raven } from '../ui/Raven';
import { Button, IconButton, TextInput, TextArea, Tag, EmptyState } from '../ui/components';

interface MemoryPanelProps {
  adapter: SiteAdapter;
  cards: Card[];
  wrap: boolean;
  template: string;
  captureEnabled: boolean;
  selectionRef: MutableRefObject<string>;
  onClose: () => void;
  onInsert: (text: string) => void;
  onSaveCard: (title: string, body: string, tagsInput: string) => Promise<void>;
}

const SITE_LABELS: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
};

function siteLabel(id: string): string {
  return SITE_LABELS[id] ?? 'Chat';
}

function shortDate(): string {
  return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MemoryPanel({
  adapter,
  cards,
  wrap,
  template,
  captureEnabled,
  selectionRef,
  onClose,
  onInsert,
  onSaveCard,
}: MemoryPanelProps) {
  const [query, setQuery] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [captureNote, setCaptureNote] = useState('');
  // Inline message when a capture source has nothing to give (e.g. the full
  // chat can't be read). Shown in the chooser; never opens an empty form.
  const [captureError, setCaptureError] = useState('');
  // Tracks whether a selection exists so the Selection source can disable. Read
  // live on render via the ref plus the window selection; re-render when the
  // page selection changes so the Selection button enables/disables in step.
  const [, force] = useState(0);

  useEffect(() => {
    const onSel = () => force((n) => n + 1);
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  const visible = searchCards(cards, query);

  function rememberSelection() {
    // Grab the live selection at pointer-down, in case selectionchange hasn't
    // fired yet for a brand-new selection.
    const live = window.getSelection?.()?.toString().trim();
    if (live) selectionRef.current = live;
    force((n) => n + 1);
  }

  function currentSelection(): string {
    return (window.getSelection?.()?.toString().trim() || selectionRef.current || '').trim();
  }

  function openDraft(body: string, title: string, note: string) {
    setDraftBody(body);
    setDraftTitle(title);
    setDraftTags('');
    setCaptureNote(note);
    setCaptureError('');
    setCapturing(true);
  }

  function captureSelection() {
    const text = currentSelection();
    if (!text) {
      setCaptureError('Select some text on the page first, then choose Selection.');
      return;
    }
    openDraft(text, text.slice(0, 48).replace(/\s+/g, ' ').trim(), 'Captured your selection.');
  }

  function captureLastMessage() {
    const text = adapter.lastMessageText();
    if (!text) {
      setCaptureError("Couldn't read the last message on this page.");
      return;
    }
    openDraft(text, `${siteLabel(adapter.id)} reply · ${shortDate()}`, 'Captured the last message.');
  }

  function captureFullChat() {
    const text = adapter.conversationText();
    if (!text) {
      setCaptureError("Couldn't read the conversation on this page.");
      return;
    }
    openDraft(text, `Full chat · ${siteLabel(adapter.id)} · ${shortDate()}`, 'Captured the full chat.');
  }

  const hasSelection = currentSelection().length > 0;

  return (
    <>
      <header className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2 text-accent">
          <Raven size={18} />
          <span className="mn-display text-sm font-semibold text-text">Muninn</span>
        </div>
        <IconButton label="Close" onClick={onClose}>
          ✕
        </IconButton>
      </header>

      {capturing ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-5 pb-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-text">New card</p>
              {captureNote && <p className="text-xs text-muted">{captureNote}</p>}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text">Title</span>
              <TextInput
                value={draftTitle}
                placeholder="Title"
                onChange={(e) => setDraftTitle(e.target.value)}
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text">Body</span>
              <TextArea
                rows={6}
                value={draftBody}
                placeholder="Captured text…"
                onChange={(e) => setDraftBody(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text">Tags</span>
              <TextInput
                value={draftTags}
                placeholder="comma separated"
                onChange={(e) => setDraftTags(e.target.value)}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button variant="ghost" onClick={() => setCapturing(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!draftTitle.trim() || !draftBody.trim()}
              onClick={async () => {
                await onSaveCard(draftTitle, draftBody, draftTags);
                setCapturing(false);
              }}
            >
              Save card
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-5 pb-4">
            <TextInput
              value={query}
              placeholder="Search cards…"
              aria-label="Search cards"
              onChange={(e) => setQuery(e.target.value)}
            />
            {captureEnabled && (
              <div className="flex flex-col gap-2">
                <span className="text-2xs font-medium uppercase tracking-wide text-muted">
                  Capture into a card
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="subtle"
                    className="flex-1"
                    disabled={!hasSelection}
                    onPointerDown={rememberSelection}
                    onClick={captureSelection}
                    title={
                      hasSelection
                        ? 'Capture the text you selected on the page'
                        : 'Select some text on the page first'
                    }
                  >
                    Selection
                  </Button>
                  <Button
                    variant="subtle"
                    className="flex-1"
                    onClick={captureLastMessage}
                    title="Capture only the latest message"
                  >
                    Last message
                  </Button>
                  <Button
                    variant="subtle"
                    className="flex-1"
                    onClick={captureFullChat}
                    title="Capture the whole visible thread"
                  >
                    Full chat
                  </Button>
                </div>
                {captureError && <p className="text-xs text-danger">{captureError}</p>}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
            {cards.length === 0 ? (
              <EmptyState
                title="No cards yet"
                hint="Open the Muninn popup to create a card, or capture text from this page."
              />
            ) : visible.length === 0 ? (
              <EmptyState title="No matches" hint="Try a different word or tag." />
            ) : (
              <ul className="flex flex-col gap-2">
                {visible.map((card) => (
                  <li key={card.id}>
                    <button
                      onClick={() => onInsert(wrapBody(card.body, template, wrap))}
                      className="mn-card w-full rounded-xl px-3 py-2.5 text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        {card.pinned && <span className="text-accent">★</span>}
                        <span className="mn-display truncate text-sm font-semibold">
                          {card.title}
                        </span>
                      </div>
                      {card.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {card.tags.slice(0, 4).map((t) => (
                            <Tag key={t}>#{t}</Tag>
                          ))}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}

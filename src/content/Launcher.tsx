// The on-page launcher: a small raven button docked to the chat input that
// expands into a compact card panel. Lives inside a Shadow DOM so its styles
// never touch the host page. It anchors itself to the site's composer (so it
// sits in the same place whether the chat is new/centered or active/bottom)
// and tracks it on scroll/resize. Clicking a card injects its (optionally
// wrapped) body into the input; the capture button grabs the current selection
// (or the last message) into a quick new-card form. Capture is always an
// explicit click — nothing is ever logged or scraped automatically.

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { SiteAdapter } from './adapters/types';
import { useCards, useSettings } from '../ui/hooks';
import { addCard, parseTags, searchCards } from '../lib/cards';
import { wrapBody } from '../lib/template';
import { insertText } from './insert';
import { Raven } from '../ui/Raven';
import { Button, IconButton, TextInput, TextArea, Tag, EmptyState } from '../ui/components';

interface LauncherProps {
  adapter: SiteAdapter;
}

interface Pos {
  x: number;
  y: number;
}

const PANEL_W = 320;
const PANEL_H = 420;
const BTN = 44;

const GAP = 12;

/**
 * Dock the button just OUTSIDE the composer's right edge, vertically centered
 * with it — beside the input, never overlapping it, consistent across new-chat
 * (centered) and active-chat (bottom) layouts. We measure the composer
 * CONTAINER (findAnchor), not the inner text field, since the editable region
 * is often narrower than the visual box (its send/voice buttons live outside
 * it). Returns null when the input can't be found (launcher hides).
 */
function computePos(adapter: SiteAdapter): Pos | null {
  const input = adapter.findInput();
  if (!input) return null;
  const box = adapter.findAnchor() ?? input;
  const r = box.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;

  const x = r.right + GAP;
  const y = r.top + r.height / 2 - BTN / 2;

  return {
    x: Math.max(8, Math.min(x, window.innerWidth - BTN - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - BTN - 8)),
  };
}

export function Launcher({ adapter }: LauncherProps) {
  const { cards, save } = useCards();
  const { settings } = useSettings();

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [toast, setToast] = useState('');
  // The page's most recent non-empty text selection. Tracked continuously so
  // Capture works even if clicking into the panel collapses the live selection.
  // Selections inside our Shadow DOM don't surface in the document selection,
  // so the panel's own inputs never pollute this.
  const lastSelection = useRef('');

  useEffect(() => {
    const onSel = () => {
      const t = window.getSelection?.()?.toString().trim();
      if (t) lastSelection.current = t;
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  // Keep the launcher docked to the input: recompute on a light poll (covers
  // SPA route changes / DOM swaps) and on scroll/resize (rAF-throttled).
  useEffect(() => {
    let raf = 0;
    const recompute = () => setPos(computePos(adapter));
    const onScrollResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recompute);
    };
    recompute();
    const id = window.setInterval(recompute, 1200);
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
    };
  }, [adapter]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  }, []);

  if (!pos) return null;

  // Panel opens to the LEFT of the button (there's room there since the button
  // sits near the right edge), vertically centered on it. Falls back to the
  // right if somehow there's no room left.
  let panelLeft = pos.x - GAP - PANEL_W;
  if (panelLeft < 8) panelLeft = Math.min(pos.x + BTN + GAP, window.innerWidth - PANEL_W - 8);
  panelLeft = Math.max(8, panelLeft);
  const panelTop = Math.max(
    8,
    Math.min(pos.y + BTN / 2 - PANEL_H / 2, window.innerHeight - PANEL_H - 8),
  );

  return (
    <>
      {/* Collapsed button */}
      {!open && (
        <button
          aria-label="Open Muninn"
          onClick={() => setOpen(true)}
          style={{ left: pos.x, top: pos.y, width: BTN, height: BTN }}
          className="mn-panel mn-pop fixed z-[2147483646] flex items-center justify-center rounded-full text-accent shadow-panel transition-transform duration-150 hover:scale-110 active:scale-95"
        >
          <Raven size={24} />
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div
          style={{ left: panelLeft, top: panelTop, width: PANEL_W, maxHeight: PANEL_H }}
          className="mn-panel mn-rise fixed z-[2147483647] flex flex-col overflow-hidden rounded-2xl text-text"
        >
          <Panel
            adapter={adapter}
            cards={cards}
            wrap={settings.wrapInjection}
            template={settings.injectionTemplate}
            selectionRef={lastSelection}
            onClose={() => setOpen(false)}
            onInsert={(text) => {
              const res = insertText(adapter, text);
              flash(res.ok ? 'Inserted.' : res.reason ?? 'Could not insert.');
            }}
            onSaveCard={async (title, body, tagsInput) => {
              await save(
                addCard(cards, { title, body, tags: parseTags(tagsInput), source: 'captured' }),
              );
              flash('Card saved.');
            }}
          />
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{ left: panelLeft + PANEL_W / 2 }}
          className="mn-panel fixed bottom-6 z-[2147483647] -translate-x-1/2 rounded-xl px-3 py-1.5 text-xs"
        >
          {toast}
        </div>
      )}
    </>
  );
}

// --- Panel (list + capture form) ------------------------------------------

interface PanelProps {
  adapter: SiteAdapter;
  cards: ReturnType<typeof useCards>['cards'];
  wrap: boolean;
  template: string;
  selectionRef: MutableRefObject<string>;
  onClose: () => void;
  onInsert: (text: string) => void;
  onSaveCard: (title: string, body: string, tagsInput: string) => Promise<void>;
}

function Panel({
  adapter,
  cards,
  wrap,
  template,
  selectionRef,
  onClose,
  onInsert,
  onSaveCard,
}: PanelProps) {
  const [query, setQuery] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [captureNote, setCaptureNote] = useState('');

  const visible = searchCards(cards, query);

  function rememberSelection() {
    // Also grab the live selection at pointer-down, in case selectionchange
    // hasn't fired yet for a brand-new selection.
    const live = window.getSelection?.()?.toString().trim();
    if (live) selectionRef.current = live;
  }

  function startCapture() {
    const sel = selectionRef.current;
    const text = sel || adapter.lastMessageText();
    setDraftBody(text);
    setDraftTitle(text ? text.slice(0, 48).replace(/\s+/g, ' ').trim() : '');
    setDraftTags('');
    setCaptureNote(
      text
        ? sel
          ? 'Captured your selection.'
          : 'Captured the last message.'
        : "Nothing to capture — select some text on the page first, then click Capture.",
    );
    setCapturing(true);
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5 text-accent">
          <Raven size={18} />
          <span className="mn-display text-sm font-semibold text-text">Muninn</span>
        </div>
        <IconButton label="Close" onClick={onClose}>
          ✕
        </IconButton>
      </header>

      {capturing ? (
        <div className="flex flex-col gap-2 p-3">
          <p className="text-2xs uppercase tracking-wide text-muted">New card from capture</p>
          {captureNote && <p className="text-2xs text-muted">{captureNote}</p>}
          <TextInput
            value={draftTitle}
            placeholder="Title"
            onChange={(e) => setDraftTitle(e.target.value)}
            autoFocus
          />
          <TextArea
            rows={5}
            value={draftBody}
            placeholder="Captured text…"
            onChange={(e) => setDraftBody(e.target.value)}
          />
          <TextInput
            value={draftTags}
            placeholder="tags (comma separated)"
            onChange={(e) => setDraftTags(e.target.value)}
          />
          <div className="flex justify-end gap-2">
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
          <div className="flex items-center gap-2 p-3 pb-2">
            <TextInput
              value={query}
              placeholder="Search cards…"
              aria-label="Search cards"
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              variant="subtle"
              // Grab the selection before focus shifts, then open the form.
              onPointerDown={rememberSelection}
              onClick={startCapture}
              title="Capture selected text (or the last message)"
            >
              Capture
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
            {cards.length === 0 ? (
              <EmptyState
                title="No cards yet"
                hint="Open the Muninn popup to create a card, or use Capture to save selected text."
              />
            ) : visible.length === 0 ? (
              <EmptyState title="No matches" hint="Try a different word or tag." />
            ) : (
              <ul className="flex flex-col gap-1.5">
                {visible.map((card) => (
                  <li key={card.id}>
                    <button
                      onClick={() => onInsert(wrapBody(card.body, template, wrap))}
                      className="mn-card w-full rounded-xl px-3 py-2 text-left active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-1.5">
                        {card.pinned && <span className="text-accent">★</span>}
                        <span className="mn-display truncate text-sm font-semibold">{card.title}</span>
                      </div>
                      {card.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
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

// The on-page dock: a small horizontal row of round buttons sitting just above
// the chat composer, right-aligned to it — a raven that opens Muninn's memory
// (context cards) and an enhance mark that opens the Enhance Prompt panel. Lives
// inside a Shadow DOM so its styles never touch the host page. It anchors to the
// site's composer (so it tracks the box whether the chat is new/centered or
// active/bottom) on scroll/resize. Each button can be turned off independently
// in Options; with both off, the dock renders nothing.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SiteAdapter } from './adapters/types';
import { useCards, useSettings } from '../ui/hooks';
import { addCard, parseTags } from '../lib/cards';
import { insertText, replaceText } from './insert';
import { Raven } from '../ui/Raven';
import { Spark } from '../ui/Spark';
import { MemoryPanel } from './MemoryPanel';
import { EnhancePanel } from './EnhancePanel';

interface LauncherProps {
  adapter: SiteAdapter;
}

type OpenPanel = 'memory' | 'enhance' | null;

const PANEL_W = 320;
const PANEL_H = 460;
const BTN = 44;
const GAP = 10; // panel ↔ dock
const COMPOSER_GAP = 18; // dock ↔ composer (clears the editable's top padding)
const DOCK_GAP = 8; // between dock buttons (matches gap-2)

interface Anchor {
  right: number;
  top: number;
}

/**
 * Find the dock anchor: the composer's right edge and top edge. The dock is a
 * horizontal row right-aligned to `right` and sitting just above `top`. We take
 * `right` from the visual CONTAINER (findAnchor — wider, so the row aligns to
 * the box's right edge) but `top` from the inner EDITABLE, because the container
 * (e.g. ChatGPT's <form>) can be much taller than the visible box, which would
 * float the dock too high. Returns null when the input can't be found.
 */
function computeAnchor(adapter: SiteAdapter): Anchor | null {
  const input = adapter.findInput();
  if (!input) return null;
  const box = adapter.findAnchor() ?? input;
  const br = box.getBoundingClientRect();
  const ir = input.getBoundingClientRect();
  if (br.width === 0 && br.height === 0) return null;
  return { right: br.right, top: ir.top || br.top };
}

export function Launcher({ adapter }: LauncherProps) {
  const { cards, save } = useCards();
  const { settings } = useSettings();

  const [open, setOpen] = useState<OpenPanel>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [toast, setToast] = useState('');
  // The page's most recent non-empty text selection. Tracked continuously so
  // Capture works even after clicking into the panel collapses the live
  // selection. Selections inside our Shadow DOM don't surface here.
  const lastSelection = useRef('');

  useEffect(() => {
    const onSel = () => {
      const t = window.getSelection?.()?.toString().trim();
      if (t) lastSelection.current = t;
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  // Keep the dock pinned to the composer: recompute on a light poll (covers SPA
  // route changes / DOM swaps) and on scroll/resize (rAF-throttled).
  useEffect(() => {
    let raf = 0;
    const recompute = () => setAnchor(computeAnchor(adapter));
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

  // Esc closes an open panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  }, []);

  const showMemory = settings.launcherEnabled;
  const showEnhance = settings.upgradeEnabled;

  // If a feature is turned off while its panel is open, close the panel.
  useEffect(() => {
    if ((open === 'memory' && !showMemory) || (open === 'enhance' && !showEnhance)) setOpen(null);
  }, [open, showMemory, showEnhance]);

  if (!anchor || (!showMemory && !showEnhance)) return null;

  // Horizontal row, right-aligned to the composer's right edge, sitting just
  // above its top edge. Clamp into the viewport.
  const n = (showMemory ? 1 : 0) + (showEnhance ? 1 : 0);
  const dockWidth = n * BTN + (n - 1) * DOCK_GAP;
  const dockLeft = Math.max(8, Math.min(anchor.right - dockWidth, window.innerWidth - dockWidth - 8));
  const dockTop = Math.max(8, Math.min(anchor.top - COMPOSER_GAP - BTN, window.innerHeight - BTN - 8));

  // Panel opens ABOVE the dock, right-aligned to the composer. It's anchored by
  // its BOTTOM edge (just above the dock) so a short panel hugs the dock instead
  // of floating at the top; its height is capped to the room above (content
  // scrolls).
  const panelLeft = Math.max(8, Math.min(anchor.right - PANEL_W, window.innerWidth - PANEL_W - 8));
  const panelH = Math.min(PANEL_H, Math.max(220, dockTop - GAP - 8));
  const panelBottom = Math.max(8, window.innerHeight - (dockTop - GAP));

  return (
    <>
      {/* Dock */}
      <div
        style={{ left: dockLeft, top: dockTop }}
        className="fixed z-[2147483646] flex flex-row items-center gap-2"
      >
        {showMemory && (
          <DockButton
            label="Open Muninn memory"
            title="Save or load context"
            active={open === 'memory'}
            delay={0}
            onClick={() => setOpen((o) => (o === 'memory' ? null : 'memory'))}
          >
            <Raven size={24} />
          </DockButton>
        )}
        {showEnhance && (
          <DockButton
            label="Enhance prompt"
            title="Enhance your prompt"
            active={open === 'enhance'}
            delay={60}
            onClick={() => setOpen((o) => (o === 'enhance' ? null : 'enhance'))}
          >
            <Spark size={22} />
          </DockButton>
        )}
      </div>

      {/* Panel */}
      {open && (
        <div
          id="muninn-launcher-panel"
          aria-label={open === 'memory' ? 'Muninn memory' : 'Enhance prompt'}
          style={{ left: panelLeft, bottom: panelBottom, width: PANEL_W, maxHeight: panelH }}
          className="mn-panel mn-rise fixed z-[2147483647] flex flex-col overflow-hidden rounded-2xl text-text"
        >
          {open === 'memory' ? (
            <MemoryPanel
              adapter={adapter}
              cards={cards}
              wrap={settings.wrapInjection}
              template={settings.injectionTemplate}
              captureEnabled={settings.captureEnabled}
              selectionRef={lastSelection}
              onClose={() => setOpen(null)}
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
          ) : (
            <EnhancePanel
              adapter={adapter}
              settings={settings}
              onClose={() => setOpen(null)}
              onReplace={(text) => {
                const res = replaceText(adapter, text);
                flash(res.ok ? 'Composer updated.' : res.reason ?? 'Could not update.');
                if (res.ok) setOpen(null);
              }}
              onToast={flash}
            />
          )}
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

// --- Dock button ----------------------------------------------------------

function DockButton({
  label,
  title,
  active,
  delay,
  onClick,
  children,
}: {
  label: string;
  title: string;
  active: boolean;
  delay: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={title}
      aria-expanded={active}
      aria-controls="muninn-launcher-panel"
      onClick={onClick}
      style={{ width: BTN, height: BTN, animationDelay: `${delay}ms` }}
      className={`mn-pop flex items-center justify-center rounded-full shadow-panel transition-[background-color,color,transform] duration-150 active:scale-95 ${
        active
          ? 'bg-accent text-accent-ink'
          : 'mn-panel text-accent hover:bg-surface-2'
      }`}
    >
      {children}
    </button>
  );
}

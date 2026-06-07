import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Launcher } from './Launcher';
import type { SiteAdapter } from './adapters/types';
import { setCards, getCards } from '../lib/storage';
import { createCard } from '../lib/cards';

// A fake composer element with a non-zero rect (jsdom returns zeros by default,
// which would make the launcher hide). Tracks setText calls for assertions.
function makeAdapter() {
  const input = document.createElement('div');
  input.getBoundingClientRect = () =>
    ({ right: 600, left: 200, top: 300, bottom: 350, width: 400, height: 50, x: 200, y: 300 }) as DOMRect;
  const setText = vi.fn();
  const adapter: SiteAdapter = {
    id: 'chatgpt',
    matches: () => true,
    findInput: () => input,
    findAnchor: () => input,
    readText: () => '',
    setText,
    findSendButton: () => null,
    lastMessageText: () => 'THE LAST ASSISTANT MESSAGE',
  };
  return { adapter, setText };
}

function mockSelection(text: string) {
  // @ts-expect-error - partial Selection is fine for the launcher's .toString() use
  window.getSelection = () => ({ toString: () => text });
}

describe('Launcher (integration)', () => {
  beforeEach(() => {
    mockSelection('');
  });

  it('docks beside the input and inserts a card (template-wrapped, appended)', async () => {
    await setCards([createCard({ title: 'My coding style', body: 'Prefer TypeScript.' })]);
    const { adapter, setText } = makeAdapter();

    render(<Launcher adapter={adapter} />);

    // Collapsed launcher button appears once the input rect is found.
    const openBtn = await screen.findByLabelText('Open Muninn');
    fireEvent.click(openBtn);

    // The seeded card shows in the panel; clicking it inserts its body.
    const card = await screen.findByText('My coding style');
    fireEvent.click(card.closest('button')!);

    await waitFor(() => expect(setText).toHaveBeenCalled());
    const inserted = setText.mock.calls[0][1] as string;
    expect(inserted).toContain('Prefer TypeScript.'); // the card body
    expect(inserted).toContain('[CONTEXT'); // wrapped in the default template
  });

  it('captures the page text selection into a new card', async () => {
    await setCards([]);
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);

    fireEvent.click(await screen.findByLabelText('Open Muninn'));

    // User selects text on the page → selectionchange updates the tracker.
    mockSelection('A highlighted passage from the chat.');
    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });

    fireEvent.click(screen.getByRole('button', { name: /capture/i }));

    const body = (await screen.findByPlaceholderText('Captured text…')) as HTMLTextAreaElement;
    expect(body.value).toBe('A highlighted passage from the chat.');
    expect(screen.getByText(/Captured your selection/i)).toBeInTheDocument();

    // Saving creates a captured card.
    fireEvent.click(screen.getByRole('button', { name: /save card/i }));
    await waitFor(async () => {
      const cards = await getCards();
      expect(cards.some((c) => c.source === 'captured')).toBe(true);
    });
  });

  it('falls back to the last message when nothing is selected', async () => {
    await setCards([]);
    const { adapter } = makeAdapter();
    render(<Launcher adapter={adapter} />);

    fireEvent.click(await screen.findByLabelText('Open Muninn'));
    // No selection set → fallback path.
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));

    const body = (await screen.findByPlaceholderText('Captured text…')) as HTMLTextAreaElement;
    expect(body.value).toBe('THE LAST ASSISTANT MESSAGE');
    expect(screen.getByText(/Captured the last message/i)).toBeInTheDocument();
  });

  it('hides entirely when the adapter cannot find the input', async () => {
    const { adapter } = makeAdapter();
    const dead: SiteAdapter = { ...adapter, findInput: () => null };
    const { container } = render(<Launcher adapter={dead} />);
    await waitFor(() => expect(container.querySelector('button')).toBeNull());
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Options } from './Options';
import { getSettings } from '../lib/storage';

describe('Options — feature toggles', () => {
  it('shows a switch for each major feature', async () => {
    render(<Options />);
    expect(await screen.findByRole('switch', { name: /on-page launcher/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /capture/i })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /prompt upgrade/i })).toBeInTheDocument();
    // Key controls keep their accessible names through the visual redesign.
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wipe all data/i })).toBeInTheDocument();
  });

  it('persists turning the launcher off', async () => {
    render(<Options />);
    const sw = await screen.findByRole('switch', { name: /on-page launcher/i });
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    await waitFor(async () => {
      expect((await getSettings()).launcherEnabled).toBe(false);
    });
  });
});

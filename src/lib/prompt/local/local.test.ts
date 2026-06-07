import { describe, it, expect, vi } from 'vitest';
import { hasPersona, hasFormat, isTerse, sentenceCount } from './detect';
import { personaLine } from './rules';
import { runLocalUpgrade } from './index';

describe('detectors', () => {
  it('detects an existing persona', () => {
    expect(hasPersona('You are a historian. Explain WW2.')).toBe(true);
    expect(hasPersona('Act as my coach')).toBe(true);
    expect(hasPersona('Summarize this article')).toBe(false);
  });

  it('detects an explicit format request', () => {
    expect(hasFormat('Give me a bulleted list')).toBe(true);
    expect(hasFormat('Return JSON')).toBe(true);
    expect(hasFormat('Answer in 3 sentences')).toBe(true);
    expect(hasFormat('Tell me about dogs')).toBe(false);
  });

  it('counts sentences', () => {
    expect(sentenceCount('One. Two. Three.')).toBe(3);
    expect(sentenceCount('Just one')).toBe(1);
    expect(sentenceCount('')).toBe(0);
  });

  it('flags terse single-sentence prompts', () => {
    expect(isTerse('write a poem')).toBe(true);
    expect(
      isTerse('Write a detailed, structured project plan for migrating our backend to Rust safely'),
    ).toBe(false);
  });
});

describe('persona lines are tone-dependent', () => {
  it('differs by tone', () => {
    expect(personaLine('technical')).not.toBe(personaLine('creative'));
    expect(personaLine('business')).toMatch(/business/i);
  });
});

describe('runLocalUpgrade aggressiveness ladder', () => {
  const terse = 'write a poem';

  it('conservative adds persona + format only', () => {
    const { applied } = runLocalUpgrade(terse, {
      tone: 'auto',
      aggressiveness: 'conservative',
    });
    expect(applied).toContain('persona');
    expect(applied).toContain('format');
    expect(applied).not.toContain('specificity');
    expect(applied).not.toContain('constraints');
  });

  it('balanced adds specificity for terse prompts', () => {
    const { applied } = runLocalUpgrade(terse, { tone: 'auto', aggressiveness: 'balanced' });
    expect(applied).toContain('specificity');
    expect(applied).not.toContain('constraints');
  });

  it('radical adds full constraint scaffolding', () => {
    const { applied } = runLocalUpgrade(terse, { tone: 'auto', aggressiveness: 'radical' });
    expect(applied).toEqual(expect.arrayContaining(['persona', 'format', 'specificity', 'constraints']));
  });

  it('does not add a persona when one already exists', () => {
    const { applied, output } = runLocalUpgrade('You are a chef. Suggest a menu.', {
      tone: 'business',
      aggressiveness: 'conservative',
    });
    expect(applied).not.toContain('persona');
    expect(output.startsWith('You are a chef')).toBe(true);
  });

  it('does not add a format when one already exists', () => {
    const { applied } = runLocalUpgrade('Summarize this as a bulleted list', {
      tone: 'auto',
      aggressiveness: 'conservative',
    });
    expect(applied).not.toContain('format');
  });

  it('returns empty for empty input', () => {
    expect(runLocalUpgrade('   ', { tone: 'auto', aggressiveness: 'radical' }).output).toBe('');
  });

  it('never makes a network call', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    runLocalUpgrade('write a poem', { tone: 'creative', aggressiveness: 'radical' });
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

import { describe, it, expect } from 'vitest';
import { wrapBody, templateHasPlaceholder, appendToText } from './template';
import { DEFAULT_INJECTION_TEMPLATE } from './types';

describe('wrapBody', () => {
  it('returns raw body when wrapping is off', () => {
    expect(wrapBody('hello', DEFAULT_INJECTION_TEMPLATE, false)).toBe('hello');
  });

  it('substitutes the placeholder when wrapping is on', () => {
    const out = wrapBody('hello', DEFAULT_INJECTION_TEMPLATE, true);
    expect(out).toContain('hello');
    expect(out).toContain('[CONTEXT');
    expect(out).toContain('[END CONTEXT]');
    expect(out).not.toContain('{{card.body}}');
  });

  it('appends body when the template lacks a placeholder', () => {
    expect(wrapBody('body', 'Prefix only', true)).toBe('Prefix only\nbody');
  });

  it('falls back to the default template when given an empty one', () => {
    expect(wrapBody('x', '   ', true)).toContain('[CONTEXT');
  });
});

describe('templateHasPlaceholder', () => {
  it('detects the placeholder', () => {
    expect(templateHasPlaceholder(DEFAULT_INJECTION_TEMPLATE)).toBe(true);
    expect(templateHasPlaceholder('no placeholder')).toBe(false);
  });
});

describe('appendToText', () => {
  it('returns addition alone when existing is empty', () => {
    expect(appendToText('', 'new')).toBe('new');
    expect(appendToText('   ', 'new')).toBe('new');
  });

  it('separates existing and addition with a blank line, never overwriting', () => {
    expect(appendToText('hello', 'world')).toBe('hello\n\nworld');
  });

  it('trims trailing whitespace before appending', () => {
    expect(appendToText('hello\n\n', 'world')).toBe('hello\n\nworld');
  });
});

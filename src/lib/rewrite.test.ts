import { describe, expect, it } from 'vitest';
import { applyRewrites, isValidPattern, parseRewrites } from './rewrite';

describe('applyRewrites', () => {
  it('replaces every match, ignoring case', () => {
    expect(applyRewrites('Carte X3480 carte x3480', [{ pattern: 'carte x\\d+', replacement: '' }])).toBe('');
    expect(applyRewrites('PAIEMENT PAR CARTE', [{ pattern: 'paiement par carte', replacement: 'CB' }])).toBe('CB');
  });

  it('supports capture groups in the replacement', () => {
    expect(applyRewrites('VIR SEPA Jean', [{ pattern: '^VIR SEPA (.+)$', replacement: 'Virement de $1' }])).toBe(
      'Virement de Jean',
    );
  });

  it('applies the rules in order and tidies the whitespace left behind', () => {
    const rules = [
      { pattern: 'PAIEMENT PAR CARTE', replacement: '' },
      { pattern: 'X\\d{4}', replacement: '' },
      { pattern: '\\d{2}/\\d{2}', replacement: '' },
    ];
    expect(applyRewrites('PAIEMENT PAR CARTE X3480 25/11 BOULANGERIE', rules)).toBe('BOULANGERIE');
  });

  it('skips empty and invalid patterns instead of failing', () => {
    expect(
      applyRewrites('abc', [
        { pattern: '', replacement: 'x' },
        { pattern: '(', replacement: 'x' },
      ]),
    ).toBe('abc');
  });

  it('returns the text untouched without rules', () => {
    expect(applyRewrites('  keep   as is ', [])).toBe('  keep   as is ');
  });
});

describe('isValidPattern', () => {
  it('accepts a regular expression and rejects a broken one', () => {
    expect(isValidPattern('a+b')).toBe(true);
    expect(isValidPattern('(')).toBe(false);
  });
});

describe('parseRewrites', () => {
  it('keeps well-formed rules and drops the rest', () => {
    expect(
      parseRewrites([{ pattern: 'a', replacement: 'b' }, { pattern: 1 }, null, 'x', { pattern: 'c', replacement: 2 }]),
    ).toEqual([{ pattern: 'a', replacement: 'b' }]);
  });

  it('returns an empty list for anything that is not a list', () => {
    expect(parseRewrites(undefined)).toEqual([]);
    expect(parseRewrites({})).toEqual([]);
  });
});

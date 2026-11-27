import { describe, expect, it } from 'vitest';
import { filterAspsps } from './aspsps';

const banks = [
  { name: 'Crédit Agricole de Centre-Est', country: 'FR' },
  { name: 'Boursorama', country: 'FR' },
  { name: 'Crédit Mutuel', country: 'FR' },
  { name: 'Société Générale', country: 'FR' },
];

describe('filterAspsps', () => {
  it('returns everything, sorted by name, for an empty query', () => {
    expect(filterAspsps(banks, '').map((b) => b.name)).toEqual([
      'Boursorama',
      'Crédit Agricole de Centre-Est',
      'Crédit Mutuel',
      'Société Générale',
    ]);
  });

  it('matches case- and accent-insensitively on any part of the name', () => {
    expect(filterAspsps(banks, 'credit').map((b) => b.name)).toEqual([
      'Crédit Agricole de Centre-Est',
      'Crédit Mutuel',
    ]);
    expect(filterAspsps(banks, 'GENERALE').map((b) => b.name)).toEqual(['Société Générale']);
  });

  it('requires every word of the query to match', () => {
    expect(filterAspsps(banks, 'agricole est').map((b) => b.name)).toEqual(['Crédit Agricole de Centre-Est']);
  });
});

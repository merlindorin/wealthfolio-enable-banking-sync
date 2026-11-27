import { describe, expect, it } from 'vitest';
import { consentValidUntil } from './consent';

const now = Date.parse('2026-11-27T00:00:00Z');
const DAY = 86_400;

describe('consentValidUntil', () => {
  it('defaults to 90 days when the bank states no maximum', () => {
    expect(consentValidUntil(undefined, now).toISOString()).toBe('2027-02-25T00:00:00.000Z');
  });

  it('caps at the bank maximum when it is shorter than 90 days', () => {
    expect(consentValidUntil(30 * DAY, now).toISOString()).toBe('2026-12-27T00:00:00.000Z');
  });

  it('never exceeds the preferred 90 days even when the bank allows more', () => {
    expect(consentValidUntil(180 * DAY, now).toISOString()).toBe('2027-02-25T00:00:00.000Z');
  });

  it('honours a custom preference up to the bank maximum', () => {
    expect(consentValidUntil(180 * DAY, now, 150).toISOString()).toBe('2027-04-26T00:00:00.000Z');
  });

  it('ignores nonsensical maximums', () => {
    expect(consentValidUntil(0, now).toISOString()).toBe('2027-02-25T00:00:00.000Z');
  });
});

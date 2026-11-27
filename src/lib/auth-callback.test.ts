import { describe, expect, it } from 'vitest';
import { parseCallback } from './auth-callback';

describe('parseCallback', () => {
  it('extracts code and state from a query string', () => {
    expect(parseCallback('?code=abc&state=xyz')).toEqual({ code: 'abc', state: 'xyz' });
  });

  it('surfaces bank-side authorisation errors', () => {
    expect(parseCallback('?error=access_denied&error_description=User%20declined')).toEqual({
      error: 'access_denied: User declined',
    });
  });

  it('returns null when the page was not opened from a redirect', () => {
    expect(parseCallback('')).toBeNull();
    expect(parseCallback('?foo=bar')).toBeNull();
  });
});

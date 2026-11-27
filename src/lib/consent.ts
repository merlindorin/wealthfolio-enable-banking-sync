const DAY_MS = 86_400_000;

/** Consent end date: the preferred length, capped at the bank's stated maximum (seconds). */
export function consentValidUntil(bankMaxSeconds: number | undefined, now: number, preferredDays = 90): Date {
  const maxDays = bankMaxSeconds && bankMaxSeconds > 0 ? bankMaxSeconds / 86_400 : Infinity;
  return new Date(now + Math.min(preferredDays, maxDays) * DAY_MS);
}

export interface Rewrite {
  pattern: string;
  replacement: string;
}

export function isValidPattern(pattern: string) {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

export function applyRewrites(text: string, rules: Rewrite[]) {
  const active = rules.filter((rule) => rule.pattern && isValidPattern(rule.pattern));
  if (!active.length) return text;

  const rewritten = active.reduce((acc, rule) => acc.replace(new RegExp(rule.pattern, 'gi'), rule.replacement), text);
  return rewritten.replace(/\s+/g, ' ').trim();
}

export function parseRewrites(value: unknown): Rewrite[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Rewrite => typeof item?.pattern === 'string' && typeof item?.replacement === 'string',
  );
}

function collect(value: unknown, path: string, counts: Record<string, number>) {
  if (value === null || value === undefined || value === '') return;
  if (Array.isArray(value)) {
    if (value.length) counts[path] = (counts[path] ?? 0) + 1;
    return;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) collect(child, path ? `${path}.${key}` : key, counts);
    return;
  }
  counts[path] = (counts[path] ?? 0) + 1;
}

/** Counts, per dotted path, how many transactions carry a non-empty value. */
export function summarizeFields(transactions: unknown[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tx of transactions) collect(tx, '', counts);
  return counts;
}

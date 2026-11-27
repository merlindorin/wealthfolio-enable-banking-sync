const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function filterAspsps<T extends { name: string }>(aspsps: T[], query: string): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return aspsps
    .filter((a) => words.every((w) => normalize(a.name).includes(w)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

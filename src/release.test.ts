import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
const pkg = JSON.parse(read('package.json'));

describe('release consistency', () => {
  it('keeps manifest.json and package.json on the same version', () => {
    expect(manifest.version).toBe(pkg.version);
  });

  it('has a changelog entry for the current version', () => {
    expect(read('CHANGELOG.md')).toContain(`## [${pkg.version}]`);
  });

  it('only ever talks to Enable Banking', () => {
    expect(manifest.network.allowedHosts).toEqual(['api.enablebanking.com']);
  });

  it('asks for no more host permissions than it uses', () => {
    const categories = manifest.permissions.map((p: { category: string }) => p.category).sort();
    expect(categories).toEqual(['accounts', 'activities', 'network', 'secrets', 'spending']);
  });
});

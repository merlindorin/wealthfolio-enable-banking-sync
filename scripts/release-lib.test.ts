import { describe, expect, it } from 'vitest';
import { changelogSection, nextVersion, releaseChangelog } from './release-lib.mjs';

describe('nextVersion', () => {
  it('bumps patch, minor and major', () => {
    expect(nextVersion('1.1.2', 'patch')).toBe('1.1.3');
    expect(nextVersion('1.1.2', 'minor')).toBe('1.2.0');
    expect(nextVersion('1.1.2', 'major')).toBe('2.0.0');
  });

  it('accepts an explicit version, with or without a v prefix', () => {
    expect(nextVersion('1.1.2', '1.4.0')).toBe('1.4.0');
    expect(nextVersion('1.1.2', 'v2.0.0')).toBe('2.0.0');
  });

  it('refuses anything that is not semver, or not newer', () => {
    expect(() => nextVersion('1.1.2', 'banana')).toThrow(/semver/i);
    expect(() => nextVersion('1.1.2', '1.1.2')).toThrow(/newer/i);
    expect(() => nextVersion('1.1.2', '1.0.0')).toThrow(/newer/i);
  });
});

describe('releaseChangelog', () => {
  const changelog =
    '# Changelog\n\n## [Unreleased]\n\n### Added\n- A thing\n\n## [1.0.0] - 2026-01-01\n\n### Added\n- First\n';

  it('files the unreleased notes under the new version and leaves an empty Unreleased section', () => {
    const out = releaseChangelog(changelog, '1.1.0', '2026-11-27');
    expect(out).toContain('## [Unreleased]\n\n## [1.1.0] - 2026-11-27\n\n### Added\n- A thing');
    expect(out).toContain('## [1.0.0] - 2026-01-01');
  });

  it('refuses to release when there is nothing under Unreleased', () => {
    const empty = '# Changelog\n\n## [Unreleased]\n\n## [1.0.0] - 2026-01-01\n';
    expect(() => releaseChangelog(empty, '1.1.0', '2026-11-27')).toThrow(/nothing to release/i);
  });

  it('refuses a changelog without an Unreleased section', () => {
    expect(() => releaseChangelog('# Changelog\n', '1.1.0', '2026-11-27')).toThrow(/Unreleased/);
  });
});

describe('changelogSection', () => {
  const changelog =
    '# Changelog\n\n## [Unreleased]\n\n## [1.1.0] - 2026-11-27\n\n### Added\n- B\n\n## [1.0.0] - 2026-01-01\n\n### Added\n- A\n';

  it('returns the notes of one version without its heading', () => {
    expect(changelogSection(changelog, '1.1.0')).toBe('### Added\n- B');
    expect(changelogSection(changelog, '1.0.0')).toBe('### Added\n- A');
  });

  it('throws when the version has no entry', () => {
    expect(() => changelogSection(changelog, '2.0.0')).toThrow(/2\.0\.0/);
  });
});

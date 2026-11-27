const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

const parse = (version) => {
  const match = SEMVER.exec(version);
  if (!match) throw new Error(`"${version}" is not a semver version (x.y.z)`);
  return match.slice(1).map(Number);
};

export function nextVersion(current, bump) {
  const [major, minor, patch] = parse(current);
  const next =
    {
      patch: `${major}.${minor}.${patch + 1}`,
      minor: `${major}.${minor + 1}.0`,
      major: `${major + 1}.0.0`,
    }[bump] ?? bump.replace(/^v/, '');

  const [a, b, c] = parse(next);
  const newer = a > major || (a === major && (b > minor || (b === minor && c > patch)));
  if (!newer) throw new Error(`${next} is not newer than ${current}`);
  return next;
}

export function releaseChangelog(changelog, version, date) {
  const heading = '## [Unreleased]';
  const start = changelog.indexOf(heading);
  if (start < 0) throw new Error('CHANGELOG.md has no "## [Unreleased]" section');

  const bodyStart = start + heading.length;
  const nextSection = changelog.indexOf('\n## [', bodyStart);
  const body = changelog.slice(bodyStart, nextSection < 0 ? undefined : nextSection).trim();
  if (!body) throw new Error('Nothing to release: the Unreleased section is empty');

  const rest = nextSection < 0 ? '' : changelog.slice(nextSection);
  return `${changelog.slice(0, start)}${heading}\n\n## [${version}] - ${date}\n\n${body}\n${rest}`;
}

export function changelogSection(changelog, version) {
  const heading = `## [${version}]`;
  const start = changelog.indexOf(heading);
  if (start < 0) throw new Error(`CHANGELOG.md has no entry for ${version}`);

  const bodyStart = changelog.indexOf('\n', start) + 1;
  const next = changelog.indexOf('\n## [', bodyStart);
  return changelog.slice(bodyStart, next < 0 ? undefined : next).trim();
}

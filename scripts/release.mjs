#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { nextVersion, releaseChangelog } from './release-lib.mjs';

const bump = process.argv[2];
if (!bump) {
  console.error('Usage: node scripts/release.mjs <patch|minor|major|x.y.z>');
  process.exit(1);
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

if (git('status', '--porcelain')) throw new Error('The working tree is not clean; commit or stash first');
if (git('branch', '--show-current') !== 'main') throw new Error('Releases are cut from main');

const pkg = readJson('package.json');
const manifest = readJson('manifest.json');
const version = nextVersion(pkg.version, bump);

writeFileSync(
  'CHANGELOG.md',
  releaseChangelog(readFileSync('CHANGELOG.md', 'utf8'), version, new Date().toISOString().slice(0, 10)),
);
writeJson('package.json', { ...pkg, version });
writeJson('manifest.json', { ...manifest, version });

execFileSync('pnpm', ['check'], { stdio: 'inherit' });
git('add', 'package.json', 'manifest.json', 'CHANGELOG.md');
git('commit', '-m', `chore(release): v${version}`);
git('tag', '-a', `v${version}`, '-m', `v${version}`);

console.log(`\nv${version} is committed and tagged. Publish it with:\n\n  git push origin main --follow-tags\n`);

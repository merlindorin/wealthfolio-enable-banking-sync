#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { changelogSection } from './release-lib.mjs';

const version = (process.argv[2] ?? '').replace(/^v/, '');
if (!version) {
  console.error('Usage: node scripts/release-notes.mjs <version>');
  process.exit(1);
}

console.log(changelogSection(readFileSync('CHANGELOG.md', 'utf8'), version));

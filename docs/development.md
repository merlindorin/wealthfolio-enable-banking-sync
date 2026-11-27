# Development

You need [Node](https://nodejs.org) 24 and [pnpm](https://pnpm.io). [Task](https://taskfile.dev) is optional; every task has a plain `pnpm` equivalent.

```sh
pnpm install
task check          # typecheck, lint, format, tests with coverage, build
task test           # just the tests
task demo           # the real UI on fictional data: http://localhost:5199
task bundle         # the installable zip: dist/
```

`task demo` renders the addon against a mocked Wealthfolio, with a made-up bank and made-up transactions, so you can work on the interface without an Enable Banking account. The screenshots in the docs come from it.

The logic lives in `src/lib`, free of React and of the host, and is where the tests are. The screens are thin. [AGENT.md](../AGENT.md) maps the repository and lists the traps.

Changes follow [Conventional Commits](https://www.conventionalcommits.org/) and tests come first.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), and that is enforced: a `commit-msg` hook runs [commitlint](https://commitlint.js.org) as soon as you install the dependencies, and CI lints every pushed commit and the title of every pull request.

```
feat: add a thing          → minor release
fix: correct a thing       → patch release
feat!: change a thing      → major release (or a BREAKING CHANGE: footer)
docs, refactor, perf       → listed in the changelog
chore, ci, test, build     → no release on their own
```

## Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please). Nothing to run by hand.

1. Commits land on `main`.
2. release-please opens, and keeps up to date, a pull request titled `chore(main): release X.Y.Z`. It holds the new version in `package.json` and `manifest.json` and the new `CHANGELOG.md` section, all computed from the commits since the last release.
3. Merge that pull request when you want to ship. release-please tags `vX.Y.Z` and creates the GitHub release.
4. The same workflow then builds the addon and attaches the zip and a `SHA256SUMS` file to the release.

A pull request opened with the default Actions token does not run CI by itself, or waits for a manual approval. So the `release-please` workflow starts CI on the release branch each time it updates the PR, and the checks appear on the PR without any approval. If you would rather have a normal pull request run, store a personal access token with `repo` scope as the `RELEASE_PLEASE_TOKEN` repository secret.

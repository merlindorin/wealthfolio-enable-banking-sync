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

## Releasing

```sh
task release -- minor     # or patch, major, or an explicit x.y.z
git push origin main --follow-tags
```

`task release` refuses to run on a dirty tree or off `main`, moves the `Unreleased` notes of [CHANGELOG.md](../CHANGELOG.md) under the new version, bumps `package.json` and `manifest.json` together, runs every check, then commits and tags `vX.Y.Z`.

Pushing the tag starts the `release` workflow. It checks the tag against the package version, rebuilds, and publishes a GitHub release with the zip, a `SHA256SUMS` file and the changelog section as notes.

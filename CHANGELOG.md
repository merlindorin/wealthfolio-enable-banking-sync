# Changelog

## [1.2.0](https://github.com/merlindorin/wealthfolio-enable-banking-sync/compare/v1.1.2...v1.2.0) (2026-11-27)


### Features

* accept the private key as a file or as pasted text ([f48939e](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/f48939e7159a5519b129b2a2b2cd0034125bbed4))


### Bug Fixes

* show the error messages in the auto sync log ([4ae70ed](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/4ae70ed8097f451c8ff7408ee6a89f2f5c6c1141))


### Changes

* keep the history options per account and trim Settings ([ef415cb](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/ef415cb190e582c867c701911e5d408cfb1ca6f8))


### Documentation

* fix the release zip name in the README ([b1659ec](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/b1659ec10de10d81bbbe54bce26c03bd7d6fa906))
* point the Enable Banking guide at the usage guide ([39e0ac1](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/39e0ac17e4ddc9492793292be49e272cefb91b3f))
* shorten the README and move the detail into docs ([9aa27e2](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/9aa27e2c633ec195d7adb6e4a794af0443ac1b93))

## [1.1.2] - 2026-11-27

First public release.

### Added

- Connect any bank supported by Enable Banking, several at once, with a consent length that follows each bank's own limit.
- Import booked transactions as cash `DEPOSIT` / `WITHDRAWAL` activities, deduplicated by the bank's entry reference, with the full raw bank entry kept in the activity metadata.
- Overview with one line per account (sync, re-import history, edit), sync schedule, sync log and a consent countdown per bank.
- Optional auto sync while Wealthfolio is open, every 1, 6 or 24 hours.
- Entries view: everything the banks return, imported or not, with the raw JSON and the matching Wealthfolio activity for debugging.
- Edit account (linked Wealthfolio account, import start date, pause) and manage bank (color, renew consent, remove) dialogs.
- Warning when a linked account is not tracked by Wealthfolio's Spending.
- Renewing a consent keeps the links, import dates and color of its accounts.

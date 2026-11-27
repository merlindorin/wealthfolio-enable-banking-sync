# Changelog

## [1.2.0](https://github.com/merlindorin/wealthfolio-enable-banking-sync/compare/v1.1.2...v1.2.0) (2026-11-27)


### Features

* accept the private key as a file or as pasted text ([dcd11a6](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/dcd11a6c2432bd28cfeba1c4c14e4c7975e58a1d))


### Bug Fixes

* show the error messages in the auto sync log ([9d3bee8](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/9d3bee8f58dd240233faa72bbc8272f6180c0a03))


### Changes

* keep the history options per account and trim Settings ([18feed8](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/18feed849b74b933c0c2e671d31b78c7363b294b))


### Documentation

* fix the release zip name in the README ([2fecec0](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/2fecec0afbfb1fd30e82aa7540a41a90f602c780))
* point the Enable Banking guide at the usage guide ([2425f86](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/2425f86bdc2b570183587352451a9ac4746b389f))
* shorten the README and move the detail into docs ([6581e1f](https://github.com/merlindorin/wealthfolio-enable-banking-sync/commit/6581e1fe75a07c9ca0e0cb00ae144c50fcbfc3c1))

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

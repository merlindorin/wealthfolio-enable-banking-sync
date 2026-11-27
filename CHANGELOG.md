# Changelog

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

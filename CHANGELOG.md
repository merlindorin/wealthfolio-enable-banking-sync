# Changelog

All notable changes to this addon are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The sync activity log now shows the error message when an automatic sync fails, instead of only a count.

### Changed

- Settings now only holds the Enable Banking credentials. Auto sync and its interval are on the overview, where they already were.
- "First sync history (days)" and "Fetch the longest history" are no longer global. The first sync of an account starts at its own "Import from" date, and a new per-account switch asks the bank for as far back as it allows.

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

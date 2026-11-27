# AGENT.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

A [Wealthfolio](https://wealthfolio.app) addon (TypeScript, React 19, Vite library build) that imports bank transactions from any bank supported by Enable Banking as cash activities. It runs inside Wealthfolio, not as a standalone app: all I/O goes through the host's addon API (`ctx.api.*`).

It only fetches and imports. Matching transfers and categorizing are deliberately left to Wealthfolio and the user's own tooling, so do not add rules, classification or AI features here.

## Build & development commands

```bash
task check            # typecheck + lint + format check + tests with coverage + build (what CI runs)
task test             # vitest
task test:coverage    # coverage thresholds on src/lib
task lint             # eslint
task format           # prettier --write
task bundle           # build + zip into dist/, installable from Settings → Extensions
task demo             # the real UI against fictional data, http://localhost:5199
task release -- minor # bump versions, move the changelog, commit and tag (does not push)

pnpm vitest run src/lib/bank.test.ts   # one file
```

## Layout

```
src/lib/        pure logic, no React, no host API — everything with tests lives here
src/hooks/      useBankSync: the only place that talks to ctx.api and holds state
src/pages/      one view per screen (overview, add bank, entries, settings)
src/components/ dialogs and UI primitives
src/styles.ts   one scoped stylesheet, injected by BankSyncApp (the host has no CSS for us)
demo/           harness that renders BankSyncApp against a mocked AddonContext
scripts/        release tooling (version bump, changelog, release notes)
```

## Conventions

- **Test first.** Write the failing test in `src/lib`, watch it fail, then implement. UI components are thin and untested; push logic into `src/lib`.
- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, ...). Release commits are `chore(release): vX.Y.Z`.
- No narrating comments. Comment only a non-obvious reason, such as an API constraint.
- `src/lib/**` must stay free of `react` and of `@wealthfolio/addon-sdk` runtime imports (type imports are fine).

## Things that are easy to get wrong

- **Activity types.** A credit is `DEPOSIT` and a debit is `WITHDRAWAL`, on a **cash** account. `CREDIT` shows as "Neutre" in Spending and `DEPOSIT` is hidden on credit-card accounts. Verified on Wealthfolio 3.13.
- **Spending tracking.** New accounts start untracked in Wealthfolio's Settings → Suivi des dépenses; the addon cannot switch that on, it can only warn (`spending.getContext`).
- **Network.** The broker allows HTTPS to hosts declared in `manifest.json` and approved at install, blocks private addresses, forbids an `Authorization` header and injects a bearer from a secret. That is why the JWT is signed in the addon, stored with `secrets.set` and passed as `auth.secretKey`.
- **Dedup id.** `sourceRecordId` is the bank's `entry_reference`, else `transaction_id`, else a deterministic hash with an occurrence counter. The host stores it as `addon:enable-banking-sync:<id>`. The importer and the Entries view share `resolveEntry` so they always agree.
- **Bank fields.** Some banks, Crédit Agricole among them, send no IBAN and no counterparty, only free text in `remittance_information`.
- **Consent renewal** creates a new session with new account uids; `renewConnection` carries links over by IBAN, else by name.
- **Versions** live in `package.json` and `manifest.json` and must match (`src/release.test.ts` checks it). Use `task release`, never edit them by hand.
- Changing `manifest.json` permissions triggers a consent dialog at install; keep the set minimal. `src/release.test.ts` pins the host and the permission categories.

## Verifying a change in a real Wealthfolio

`task bundle`, install `dist/*.zip` from Settings → Extensions, approve `api.enablebanking.com`, open Bank Sync. The demo harness does not exercise the real host.

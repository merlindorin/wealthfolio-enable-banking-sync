# Using the addon

Details behind the [README](../README.md): what gets imported, what each setting does, and the limits to know about.

## How it works

```
   your bank                Enable Banking            Wealthfolio (your server)
  ┌─────────┐   PSD2     ┌────────────────┐      ┌──────────────────────────────┐
  │ accounts│◀──────────▶│  account info  │◀─────│  network broker (HTTPS only, │
  │  + SCA  │  consent   │      API       │ JWT  │  approved host)              │
  └─────────┘            └────────────────┘      │            ▲                 │
                                                 │  ┌─────────┴──────────┐      │
                                                 │  │  this addon        │      │
                                                 │  │  signs the JWT,    │      │
                                                 │  │  maps, dedupes     │      │
                                                 │  └─────────┬──────────┘      │
                                                 │            ▼                 │
                                                 │   cash activities in         │
                                                 │   your own accounts          │
                                                 └──────────────────────────────┘
```

You register an application with Enable Banking and get a private key. The
addon keeps that key in Wealthfolio's secrets vault, signs a one-hour token with
it, and hands the token to Wealthfolio's network broker, which is the only thing
allowed to call out. You authorise each bank once, at the bank. After that the
addon fetches booked transactions, turns each one into a deposit or a
withdrawal, and skips anything it has already imported.

A sync re-reads only the last seven days of an account it already knows, and
every entry has a stable id, so running it twice does nothing the second time.

## How transactions are imported

Each booked entry from the bank becomes one cash activity:

| Bank says | Becomes      | Why                                                   |
| --------- | ------------ | ----------------------------------------------------- |
| Debit     | `WITHDRAWAL` | Counts as spending in a Spending-tracked cash account |
| Credit    | `DEPOSIT`    | Categorizable as income                               |

The amount is always positive and the direction comes from the type. Pending
entries are not fetched, only booked ones.

Every activity carries:

- **A stable id**, the bank's `entry_reference` (else `transaction_id`, else a
  deterministic hash), stored by Wealthfolio as
  `addon:enable-banking-sync:<id>`. That is what makes a second sync a no-op.
- **A comment** made of the counterparty name when the bank gives one, and the
  remittance text.
- **The raw bank entry**, in the activity's metadata under
  `addons.enable-banking-sync.raw`, with the IBANs, bank transaction code and
  reference number lifted out when the bank provides them.

Account type matters. Use a **cash** account: on a credit-card account a
`DEPOSIT` is hidden from Spending, and a `CREDIT` activity counts as "Neutre",
neither spending nor income. The addon creates cash accounts when you ask it to.

## Settings

| Setting                        | Where        | Default     | What it does                                                                               |
| ------------------------------ | ------------ | ----------- | ------------------------------------------------------------------------------------------ |
| Auto sync                      | Overview     | off         | Syncs every linked account on a timer, **only while Wealthfolio is open in a browser tab** |
| Interval                       | Overview     | 6 h         | 1, 6 or 24 hours                                                                           |
| Import from                    | Edit account | none        | A date for this account's first sync                                                       |
| As far back as the bank allows | Edit account | off         | Asks the bank for its longest history on this account's first sync                         |
| Sync this account              | Edit account | on          | Pauses one account without unlinking it                                                    |
| Bank color                     | Manage bank  | by position | The dot that marks a bank in the overview                                                  |

The import date and the history option apply to an account that was never
synced, or after **Re-import history**. Re-importing is safe: entries already in
Wealthfolio are skipped. **Settings** only holds your Enable Banking credentials.

## Limits

- **Auto sync is not a server job.** Wealthfolio does not run addon code on its
  server, so syncing happens only while someone has Wealthfolio open. If you
  need unattended syncing, run the import from a scheduler against Wealthfolio's
  API instead.
- **Consents expire**, at most every 90 days. The overview counts them down and
  [renewing](enable-banking.md#renewing-a-consent) keeps your links.
- **New accounts are not tracked by Spending.** Wealthfolio does not let an addon
  turn that on. Until you do, activities appear under Investments. The addon
  warns you on each affected account.
- **Banks differ.** Some send no IBAN and no counterparty, only free text, so
  matching transfers between your own accounts has to work from the wording and
  amounts. Crédit Agricole is one of them.
- **How much history you get** is the bank's decision and varies a lot. Some
  banks only go back about 90 days unless you re-authenticate, others go back
  more than a year. Turn on "Fetch as far back as the bank allows" in the account's edit dialog and see what comes back.
  If the bank refuses the start date you asked for (`Wrong transactions period requested`), the addon retries with the longest period the bank allows, then with the bank's own default, and the sync log says the history was limited.
- **Tested on** a self-hosted Wealthfolio 3.13 in the browser. The desktop app
  has no public address for the bank to return to, so the redirect flow does not
  apply there.

See also [Connecting Enable Banking](enable-banking.md).

# Security

This addon holds the credentials of an Enable Banking application and reads the transactions of your bank accounts, so it is built to keep both as narrow as possible.

## What it protects

- The application's **private key** is stored only in Wealthfolio's secrets vault and is never written to the addon's own storage, logged or displayed again after saving.
- Every request to Enable Banking goes through Wealthfolio's network broker, which only reaches `api.enablebanking.com` once you approve that host at install time. The signed token is passed to the broker as a bearer secret, so request-building code never sees an `Authorization` header.
- Access is **read-only** (account information). The addon cannot initiate payments.
- No telemetry, analytics or third-party services. The only external host is Enable Banking.

## Reporting a vulnerability

Please do not open a public issue. Use [GitHub's private vulnerability reporting](../../security/advisories/new) on this repository, with what you found and how to reproduce it. You will get an answer within a few days.

## Good practice for users

- Keep the Enable Banking private key out of version control and chat; it only belongs in the addon's credentials form.
- Register your own Enable Banking application and whitelist only the redirect URL of your Wealthfolio instance.
- Revoke a bank consent from the bank or from the addon (Manage bank → Remove) when you stop using it.

# Connecting Enable Banking

This addon reads your accounts through [Enable Banking](https://enablebanking.com), a PSD2 open-banking provider. You register **your own application** with them, which gives you a private key the addon uses to sign its requests. Nothing goes through a server of mine: the key stays in your Wealthfolio.

This guide takes you from nothing to a first synced bank.

- [1. Create an Enable Banking account](#1-create-an-enable-banking-account)
- [2. Register an application](#2-register-an-application)
- [3. Check the private key](#3-check-the-private-key)
- [4. Whitelist the redirect URL](#4-whitelist-the-redirect-url)
- [5. Give the credentials to the addon](#5-give-the-credentials-to-the-addon)
- [6. Connect a bank](#6-connect-a-bank)
- [7. Sandbox or real banks](#7-sandbox-or-real-banks)
- [Renewing a consent](#renewing-a-consent)
- [Troubleshooting](#troubleshooting)

## 1. Create an Enable Banking account

Go to the [sign-in page](https://enablebanking.com/sign-in), enter your email and follow the one-time link they send you. A new account is created automatically the first time. You land in the **Control Panel**, where you manage applications.

## 2. Register an application

In the Control Panel, open **API applications** and fill in **Add a new application**:

- **Environment**: keep **Sandbox** for now. It gives you fake banks so you can try everything without touching a real account. See [step 7](#7-sandbox-or-real-banks) for real banks.
- **Private key**: keep the default option, where your web browser generates the key.
- **Application name**: shown to you at your bank when you authorise access, so pick something you will recognise, such as `My Wealthfolio`.
- **Redirect URLs**: the page your bank sends you back to. See [step 4](#4-whitelist-the-redirect-url).

Press **Register**. Your browser saves a file named after the application id, for example `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pem`. **That file is the only copy of the private key**: Enable Banking does not keep it. Store it somewhere safe, and note the application id (the file name without `.pem`).

## 3. Check the private key

The addon signs its requests with Web Crypto, which only reads **PKCS#8** keys. Look at the first line of the file:

```sh
head -1 aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pem
```

| First line                        | What to do                                                                 |
| --------------------------------- | -------------------------------------------------------------------------- |
| `-----BEGIN PRIVATE KEY-----`     | Nothing, it is PKCS#8.                                                     |
| `-----BEGIN RSA PRIVATE KEY-----` | Convert it: `openssl pkcs8 -topk8 -nocrypt -in key.pem -out key-pkcs8.pem` |

## 4. Whitelist the redirect URL

After you authorise access, your bank sends your browser back to a URL you whitelisted. For this addon it is the addon's own page on your Wealthfolio:

```
https://<your-wealthfolio-host>/addons/enable-banking-sync
```

Enable Banking requires **HTTPS**, so your Wealthfolio needs a real TLS hostname. The redirect is handled by the addon page itself, which reads the `code` and `state` from the URL, so it works for a self-hosted Wealthfolio served over HTTPS. It does not work for the desktop app, which has no public address to come back to.

You can edit the whitelisted URLs of an application in the Control Panel at any time.

## 5. Give the credentials to the addon

Open **Bank Sync → Settings** in Wealthfolio and fill in the credentials card:

![The settings screen with the credentials form](img/settings.png)

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Application ID | The id from step 2                                                          |
| Private key    | The whole content of the `.pem` file, including the `BEGIN` and `END` lines |
| Redirect URL   | The URL from step 4, exactly as whitelisted                                 |

Press **Save credentials**. The key goes into Wealthfolio's secrets vault and is never shown again, which is why the form is empty afterwards and the title only gains a ✓.

## 6. Connect a bank

Open **Bank Sync → Add a bank**:

![Choosing a bank](img/add-bank.png)

1. Pick the country and press **List banks**, then search by name. The list is whatever your Enable Banking environment offers.
2. Pick your bank, then **Continue at your bank**. A new tab opens on your bank's own authorisation page.
3. Log in and approve access, as you would for any open-banking app. You are sent back to the addon page.
4. The addon lists the accounts your bank shared. For each one, **link it to a Wealthfolio account**, or create a new cash account.
5. If you created accounts, turn on **Spending** for them in Wealthfolio under Settings → Suivi des dépenses, otherwise their activities show under Investments. The addon warns you when an account is not tracked.

The first sync starts when you press **Sync** on an account, or on the next automatic sync. See the [usage guide](usage.md#how-transactions-are-imported) for what gets imported.

## 7. Sandbox or real banks

A **Sandbox** application only talks to Enable Banking's fake banks. It is the right place to check that your key, redirect URL and the whole flow work.

To link your own real accounts, you need an application in the **Production** environment. Enable Banking offers a restricted production mode meant for connecting your own accounts for personal use, without a commercial contract. Their [quick start](https://enablebanking.com/docs/api/quick-start) and [FAQ](https://enablebanking.com/docs/faq) describe how to request it. Registering a production application can ask for a description, a data-protection contact email and privacy and terms URLs, as their API reference lists.

Once you have a production application, repeat steps 2 to 5 with its id, key and redirect URL.

## Renewing a consent

Open banking consents expire. The addon asks each bank for the longest consent it allows, never more than 90 days, and shows the countdown on the overview. Before it ends, open **Manage bank → Renew consent** and authorise again. The new session replaces the old one and **keeps** your account links, import dates and bank color. A consent that ends does not delete anything already imported.

## Troubleshooting

| What you see                                              | What it means                                                                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Private key must be a PKCS#8 PEM`                        | The key starts with `BEGIN RSA PRIVATE KEY`. Convert it, see [step 3](#3-check-the-private-key).                      |
| `Enable Banking credentials are not configured`           | Application id or key is missing. Save them in Settings.                                                              |
| `... failed (401)`                                        | The id and the key do not match, or the key was regenerated. Use the id that matches the `.pem` file name.            |
| The bank page says the redirect URL is not allowed        | The redirect URL in the addon is not exactly one of the whitelisted URLs, including the scheme and the trailing path. |
| `Unknown authorisation state; start the connection again` | You came back from the bank in another browser or after clearing the addon's storage. Start **Add a bank** again.     |
| Your bank is not in the list                              | It is not available in the chosen environment or country. Sandbox only lists test banks.                              |
| `Bank consent for ... expired`                            | Renew it from **Manage bank**.                                                                                        |
| Network error on the first call                           | Approve the host `api.enablebanking.com` in the install dialog.                                                       |

If you hit something else, open an issue with the error text and no credentials.

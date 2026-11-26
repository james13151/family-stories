# Plans and billing

Accounts already register with email and a password. Each account is one family: stories, photographs, recordings, and the memoir are loaded with that account's id, and an export refuses a mix of accounts.

Two plans exist:

| Code | What it includes now |
| --- | --- |
| `gift` | The default. Stories, booklets, the memoir editor, TXT, CSV, ZIP, PDF, and EPUB. The birthday gift card stays on this plan. |
| `family` | The same, plus a reserved `print-checkout` feature for a later per-book order. |

An unknown plan value is treated as `gift`, so a bad row cannot lock someone out. New accounts and existing accounts stay on `gift` until a person changes the column. Nothing in the app charges a card.

Billing is Stripe-shaped and switched off. `lib/billing/plans.ts` can build a Checkout Session body (`mode=subscription`, the family price id, and the account id) for Hong Kong and international cards. The app does not send that request. It sends one only if a later change decides to, and only when all of these are set:

- `STRIPE_BILLING_ENABLED=true`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_FAMILY`

Do not commit those values. Mainland China payments are not Stripe. Alipay or WeChat would be a separate integration.

A print order has a `PrintIntent` table for later: trim, cover, paper, an empty partner SKU, and an empty Stripe checkout id. This version does not insert rows and does not take payment. `preparePrintCheckout` returns the selected product and `print-partner-not-connected`.

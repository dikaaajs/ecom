# Phase 6 — Customer Accounts & Cross-Device Digital Delivery

## Overview
An account replaces the fragile same-tab-only checkout token for **new** orders. 
The existing NextAuth provider remains available for merchant admins, while a
second Credentials provider (`customer`) authenticates registered buyers.
Customers can log in on another device and access `/account/orders` and
`/account/orders/[id]`. Admin authorization remains role=admin only.

### New routes
- `/account/register`: name, email and bcrypt-hashed password registration
- `/account/login`: buyer login via NextAuth provider `customer`
- `/account/orders`: orders owned by the signed-in customer
- `/account/orders/[id]`: detail, pending payment redirect and paid digital download
- `POST /api/account/register`: basic per-process throttling, validation, bcrypt
- `GET /api/account/orders`: order list scoped to session.customerId
- `POST /api/account/claim-order`: optional one-time migration of a legacy guest
  order using the 256-bit checkout token that was issued for that order

New orders from `POST /api/checkout/orders` **require the signed-in customer
session and contact.email matching the account email**. Customer records are
no longer duplicated on every new checkout; they are linked to a registered
customerId. The 256-bit checkout token remains generated for compatibility
with the current Midtrans return experience but order views and private digital
downloads are authorized through the logged-in owner's session.

**No automatic claiming by email**: older guest orders are stored against their
original Customer rows. A registered buyer must provide the original checkout
session secret through the claim action; a matching email alone cannot
establish ownership. After claiming, guest-token-only access to the order
is disabled. Neither account registration nor login marks an order PAID.

## Database migration

Run on a backed-up staging database first:

```cmd
git switch feat/phase-6-order-payment-midtrans
git pull --ff-only
npx prisma migrate deploy
npx prisma generate
npx tsc --noEmit
npm run build
npm run dev
```

New migration: `20261111000000_customer_accounts`.
Requires Phase 5 and prior Phase 6 migrations to be applied in order.

## Manual QA

1. Register a buyer account with a unique email and password >= 12 chars.
2. Log in. Storefront account button should become **Pesanan Saya**.
3. Add a physical or digital product, fill checkout, and keep the email equal
   to the logged-in account. Order creation must require an authenticated buyer.
4. Complete Midtrans Sandbox payment; verify PAID in the admin dashboard.
5. Open **Pesanan Saya** from a *new browser/device*, log in, and verify the paid
   order appears without accessing the original tab.
6. Open the order and download a DIGITAL purchased item. Ensure the file is served
   through a 60-second private signed URL, never a public bucket.
7. Log in with a different buyer account: the first buyer's order must not appear
   and direct GET/download using its ID must return 404 or 403.
8. Test an unpaid digital order: download must be blocked.
9. For an old guest checkout, register/login in the original tab and click
   **Tautkan pesanan lama**. No other account can claim it without its token.
10. Test logging in as merchant/admin and trying customer endpoints. Must be 401.
11. Confirm that the merchant Dashboard still requires the admin role.
12. Verify user password never appears in public API responses; database stores
    only bcrypt password hash.
13. Run `npx tsc --noEmit` and `npm run build`; confirm migrations on staging
    and review deployment checks before merging.

## Security & production gates

- Passwords use bcrypt (12 rounds). Rate limiting of registration is **per
  process**, not distributed; a durable IP/email rate limiter, CAPTCHA or
  equivalent abuse controls are required before public production use.
- **Email ownership is not verified** in this initial implementation. Add email
  verification, password-reset flow, session revocation, MFA optional,
  bot protection and account recovery before production. Do not treat an
  account email as proof of legacy guest order ownership.
- Accounts are separate from admin credentials but share the same NextAuth
  signed session system, so signing into a buyer account in the same browser
  replaces its previous admin login. This is expected.
- Existing guest orders without their original token cannot be automatically
  imported. Build a manual customer-support verification process if required.
- The 60-second signed Supabase URL remains a bearer link: anyone possessing
  it can use it until expiry. Avoid logging or sharing these URLs.
- `CRON_SECRET`, `MIDTRANS_SERVER_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  and `NEXTAUTH_SECRET` must remain server-side, never public or committed.

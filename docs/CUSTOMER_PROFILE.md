# Buyer profile and address book

The storefront account button is for buyers only: customer sessions go to
`/account/profile`; guests, revoked sessions and admin sessions go to
`/account/login`, which links to buyer registration. Admin sign-in and dashboard
remain separate. A successful buyer login starts a fresh profile document.

Profile controls include name, phone, a private photo, verified email changes,
saved recipient addresses and a password-reset link. Navigation connects profile
and order history. All APIs derive ownership from the authenticated customer
session, reject admin/guest sessions, check mutation origins and never accept a
client-supplied owner ID. Responses are private/no-store and omit password
hashes, token hashes, session versions and internal storage-path fields.

## Email changes

Requesting a new address requires the current password and is limited per
account. The old address remains active until a 30-minute one-time link is
confirmed at the new mailbox. Only its hash, target email and initiating session
version are stored. Confirmation atomically updates account/customer email,
increments sessionVersion, and consumes outstanding action tokens. Old sessions
and reset links stop working; a password reset also invalidates pending email
changes. Conflicts or stale/replayed tokens cannot partially change the email.
No raw change link is logged. Resend configuration is the same as registration.

## Photos and addresses

Photo uploads require the existing Supabase server URL/service key. The app
creates a separate **private** `customer-avatars` bucket if missing and refuses a
public bucket. JPG/PNG/WEBP files are checked by signature and limited to 1 MB.
Stored paths are server-only; authenticated profile reads issue 10-minute signed
URLs. Replaced/deleted photos are cleaned up on a best-effort basis.

Address creation, editing, default selection and deletion are ownership-scoped.
Mutations lock the customer row to serialize default selection; the first saved
address becomes primary, and deleting a primary address promotes another when
available. Up to 20 addresses may be added. Checkout deduplicates stored
addresses and preserves the profile's name/phone and primary-address choice.
Order recipient/address snapshots remain unchanged when a profile is edited.
The address book does not bypass the checkout's shipping-region/rate validation;
checkout still asks the buyer to confirm delivery details.

## Setup

Apply `20261112010000_customer_profile` and regenerate Prisma Client:

```powershell
npx.cmd prisma migrate deploy
npx.cmd prisma generate
npx.cmd tsx --test scripts/customer-profile.test.ts
npx.cmd tsc --noEmit
npm.cmd run build
```

The opt-in integration script `scripts/test-customer-profile.cjs` expects a
running local production server at port 3108 (override with PROFILE_TEST_URL).
Run with CONFIRM_PROFILE_TEST=yes only on the intended test database. It creates
two disposable buyers, checks profile/address ownership, concurrent default
selection, verified-email replay/expiry/conflict handling, session revocation,
reset-token invalidation and private photo storage, and removes its own fixtures
in a finally block. It sends no real email or payment.

Verified: 17 unit/regression tests, TypeScript and production build pass;
integration tests pass against the configured database/storage. Browser checks
covered buyer login to profile, saving name/phone/address, persistence after
login again, same-origin logout, and mobile layout without horizontal overflow.
All disposable integration and browser accounts/addresses were removed.

Development output now uses `.next-dev`; production keeps `.next` so the two
servers do not overwrite each other's generated chunks. Stop dev before Prisma
generation on Windows if its engine DLL is locked.

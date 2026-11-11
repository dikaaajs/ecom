# Account Security — Email verification, Password Reset, Login Limits

## Scope
Customer account security only; admin authentication uses the pre-existing independent credentials provider and has not been migrated to email-verification in this PR.

### Implemented
- New customer registrations are **unverified** and cannot log in or checkout until they verify email.
- Verification email links use 256-bit random one-time tokens; only SHA-256 hashes are stored.
  - Verify links expire after **24 hours**; request a new one at `/account/verify`.
  - Password reset links expire after **30 minutes** at `/account/reset-password`.
  - Tokens are atomically consumed in DB transactions; replay is rejected.
- Password reset stores bcrypt hash (12 rounds), increments `CustomerAccount.sessionVersion` and invalidates customer JWT sessions during NextAuth session refresh/authorization.
- Persistent Postgres throttling for customer login by email and IP, and email requests by email/IP. Limits survive server restarts and separate Vercel instances.
- Forgot-password and resend responses do not reveal if an email exists.
- Forms exist at `/account/login`, `/account/register`, `/account/verify`, `/account/forgot-password`, `/account/reset-password`.
- Signed-in customers retain account-scoped access to their paid digital order downloads.

## Resend transactional email configuration

Use https://resend.com to create an API key and verify a sender domain.

Server-side environment variables:

```dotenv
RESEND_API_KEY=re_your_api_key
ACCOUNT_EMAIL_FROM=Pixel Perfection <no-reply@your-verified-domain.com>
ACCOUNT_APP_URL=https://your-staging-site.example
# Existing:
NEXTAUTH_SECRET=your-strong-random-secret
NEXTAUTH_URL=https://your-staging-site.example
# On Vercel or another trusted proxy, opt in if forwarded IP is trustworthy:
AUTH_TRUST_PROXY=true
```

For local development, `ACCOUNT_APP_URL=http://localhost:3000` is allowed.

The sender must be authorized by Resend. These credentials must **not** use `NEXT_PUBLIC_` and must never be committed to GitHub.

The provider uses `POST https://api.resend.com/emails` from server code. Neither email verification nor reset should fall back to printing secrets in the console. If email delivery fails after registration, the account stays unverified and the buyer can request a resend.

## Staging migration & checks

```cmd
git switch feat/phase-6-order-payment-midtrans
git pull --ff-only
npx prisma migrate deploy
npx prisma generate
npx tsc --noEmit
npm run build
npm run dev
```

Migration: `20261111010000_account_security`, following the prior customer-accounts migration.

**Existing buyer accounts** are intentionally left `emailVerifiedAt=NULL`; they must request verification to log in after the migration. Do not mark arbitrary emails verified without checking ownership.

## QA checklist
1. Configure Resend domain, server key and application URL, then restart app.
2. Register using a real mailbox; login before verifying should be rejected.
3. Click the verify link; login succeeds, including across devices.
4. Reopen the used link; must be rejected. Wait past 24h or change staging token expiry to test expiry.
5. Request resend, validate email arrives. Too-frequent resends should not send unlimited mail.
6. Request password reset; page must give the same generic response for existing and unknown emails.
7. Complete reset; only new password works, used link cannot work again.
8. Test existing browser sessions: after a password reset, account-scoped endpoints should reject old JWT sessions (role demoted to revoked).
9. Submit repeated invalid credentials: email-based cap (10/15 min) and IP cap (35/15 min) should block excessive login attempts.
10. Register repeatedly: DB throttling should restrict requests (8/hour/IP). Run verification/resend/password reset abuse tests.
11. Ensure `/api/admin` and dashboard admin access still deny customer sessions.
12. Inspect logs and browser devtools for accidental token, email API key, or password leakage.
13. Confirm no automated customer emails are sent without matching configuration; test Resend error and retry path.
14. Complete Prisma migrate, `npx tsc --noEmit`, `npm run build`, and staged browser + API QA before PR merge.

## Remaining production hardening
- A durable CAPTCHA/bot challenge or external abuse protection should complement rate limits.
- For a multi-tenant store, add centralized mail-delivery monitoring and email-bounce handling.
- Account recovery and identity verification need a support process; there is intentionally no email-only way to claim guest orders.
- Login lockout policy should be reviewed for denial-of-service risks; use short windows and protect trusted proxy IP headers.
- Consider optional MFA, verified-email changes, admin 2FA, audit trails, session management and breach-password screening.
- Avoid logging raw verification links, reset links, session tokens or signed storage URLs.
- Existing session cookies are JWT and require request-time account session-version checks. Evaluate database-backed sessions for wider revocation controls if required.

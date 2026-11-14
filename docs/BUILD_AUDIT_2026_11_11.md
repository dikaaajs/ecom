# TypeScript and production build audit

Branch: `feat/phase-6-order-payment-midtrans`  
Baseline: `02c69b6`  
Environment: Windows, Node.js 24.21.0, npm 11.19.0; locked Next.js 15.5.16 and Prisma 6.15.0.

## Reproduced errors and fix

`npx tsc --noEmit` reported two TS2345 errors at `lib/auth.ts:20` and
`lib/auth.ts:55`. The production build also failed its type check at the first
call. Both customer and admin Credentials providers pass a NextAuth request
whose `headers` property is optional to `requestIp`, which previously required it.

The shared helper now accepts optional headers and uses optional access for the
record form. Missing headers resolve to `unknown` when proxy trust is enabled,
or `untrusted-client` otherwise. The existing proxy trust policy, first forwarded
IP selection and 100-character cap remain enforced. No type-check suppression,
casts, database schema changes or dependency upgrades were needed.

Added `scripts/account-security.test.ts` to cover missing/undefined/empty
headers, Web `Headers`, NextAuth-style records, multiple forwarded IPs, empty
values, length limits and disabled/unset proxy trust.

## Validation results

| Check | Result |
| --- | --- |
| `npm install` | Passed; lockfile unchanged |
| `npx prisma generate` | Passed, Prisma Client 6.15.0 |
| `npx prisma validate` | Passed with temporary placeholder `DATABASE_URL` and `DIRECT_URL`; no database connection |
| `npx tsx --test scripts/account-security.test.ts` | Passed, 1 test containing the regression cases |
| `npx tsc --noEmit` | Passed before and after the successful build |
| `npm run build` | Passed with no application environment variables; all 29 static pages generated |
| `npm run start` + local HTTP requests | Passed: five public account forms returned HTTP 200 and rendered `no-referrer` metadata |
| Invalid JSON-object payloads on verify/reset/forgot/resend APIs | Rejected with HTTP 400/422 and `Cache-Control: private, no-store` |
| `git diff --check` | Passed |

On this Windows host, PowerShell blocks `npm.ps1`; the commands above were run
through `npm.cmd`/`npx.cmd`. Initial restricted installation/build attempts also
hit filesystem EPERM errors, and local HTTP checks hit network restrictions.
Repeating with the required execution permissions succeeded. These were host
restrictions, not additional repository errors.

## Account/Prisma review and remaining verification

Reviewed the customer/admin NextAuth providers and type declarations,
registration, verification/resend, forgot/reset handlers, account pages,
Prisma account/token/rate-limit models and their migrations. These modules pass
TypeScript and production compilation. The token relation's cascading foreign
key is present in both the schema and account-security migration.

No real database, Resend or Midtrans credentials were supplied. No migrations
were applied and no real emails/payments were sent. Database-backed login,
token replay/concurrency, delivery, session revocation and payment flows still
require staging QA described in `ACCOUNT_SECURITY_SETUP.md`. Schema validation
alone does not prove migrations or live workflows succeed.

Non-blocking warnings: Prisma reports the deprecated `package.json#prisma`
configuration, and npm reports 16 dependency vulnerabilities (1 moderate,
13 high, 2 critical). Dependency remediation needs a separate compatibility
review; this fix preserves the lockfile. PR #7 was not merged.

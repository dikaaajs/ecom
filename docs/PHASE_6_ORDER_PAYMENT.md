# Phase 6 — Order & Payment Gateway (Midtrans Snap, sandbox first)

## Current scope

**Phase 6 is built on the unmerged Phase 5 branch.**
Do not merge this PR directly to master before Phase 5 and its migrations pass QA.

Implemented:

- Guest checkout for physical, digital-only and mixed carts.
- Buyer details for digital-only items and delivery address from Phase 5 for physical items.
- Server-side Zod validation of checkout input and RajaOngkir district hierarchy.
- Final server re-quote of shipping (selected courier code + service only; client price ignored).
- Server-side product prices, publish state, stock, digital asset presence and package weight validation.
- Atomic inventory reservation before payment token creation. All order-item prices and
  shipment weight/courier are snapshotted in PostgreSQL.
- Midtrans Snap redirect creation (sandbox by default; server key kept in server env).
- Authenticated-by-secret guest status endpoint (the SHA-256 hash of the 256-bit token is
  stored, and the original token is kept in tab sessionStorage, never in order URLs).
- Midtrans webhook signature verification (SHA-512 with server key), checked amount,
  idempotent transitions and reserve-stock release on cancelled/denied/expired payments.
- Server-side status refresh using Midtrans GET Status API (useful for localhost QA).
- CRON_SECRET-protected reconciliation endpoint for abandoned pending checkouts.

Still NOT implemented: verified buyer identity/account login, buyer digital downloads,
refunds, automatic courier booking, inventory management for partial refunds,
payment retries after cancellation, customer emails and production-grade distributed
abuse/rate limits. These MUST be addressed before public production launch.
Midtrans return/callback UI never marks an order PAID by itself.

## First-time setup (sandbox)

Open https://dashboard.sandbox.midtrans.com, select your merchant account and
find **Settings > Access Keys** (or equivalent API Keys screen). Retrieve
**Sandbox Server Key** (not Client Key).

Store in `.env.local`:

```dotenv
MIDTRANS_SERVER_KEY=SB-Mid-server-your-server-key
MIDTRANS_IS_PRODUCTION=false
CRON_SECRET=generate-a-strong-random-secret
# Existing:
RAJAONGKIR_API_KEY=your-shipping-cost-key
SUPABASE_SERVICE_ROLE_KEY=your-private-supabase-key
```

Never add `NEXT_PUBLIC_` to the Midtrans Server Key, and never paste secret
keys into GitHub, a screenshot, or chat. Midtrans redirect mode does **not** need
the Client Key in the browser.

**Live payments are locked out** even with a production server key until BOTH:
- `MIDTRANS_IS_PRODUCTION=true`
- `MIDTRANS_ENABLE_LIVE_PAYMENTS=true`

Do NOT set them in production until QA, inventory recovery, legal/business
requirements and customer authentication are complete.

## Database upgrade (backed-up staging DB first)

```cmd
git switch feat/phase-6-order-payment-midtrans
git pull --ff-only
npx prisma migrate deploy
npx prisma generate
npx tsc --noEmit
npm run build
npm run dev
```

Migration adds order guest access hash/destination district ID, `PaymentState`
enum and a `payment_transactions` table. It is intentionally NOT applied to
your database automatically by pushing the branch to GitHub.

## Sandbox checkout test

1. Confirm Phase 5 merchant shipping origin, RajaOngkir region selector, rates and
   Supabase private bucket are working.
2. Test with a product marked PHYSICAL, known positive stock and valid weight.
3. Add to cart, fill/save address, click **Cek ongkir** and select a service.
4. Click **Buat pesanan & lanjut bayar**. You should be redirected to Midtrans
   Sandbox payment page. A new Order should appear in Admin > Orders with
   status **PENDING_PAYMENT**. Its Shipment is **PENDING**.
5. Complete a sandbox payment using a test method documented by Midtrans.
   Return to `/checkout/confirmation` **in the same browser tab**. Click
   **Periksa status terbaru** (server calls Midtrans GET Status API).
6. Confirm Order becomes **PAID**, PaymentTransaction becomes **PAID** and
   stock was only reserved ONCE. Shipping fulfillment may then move through
   READY → SHIPPED → DELIVERED via Phase 5 admin detail page.
7. Test digital-only with buyer name/email/phone. No address or shipping fee
   should be required; however **buyer download remains disabled**.
8. Test mixed carts: only physical items affect courier weight and shipping.
9. Cancel/expire a sandbox transaction. Confirm Order becomes CANCELLED and
   stock reservation is returned once. Duplicate webhook must not duplicate stock.
10. Verify anonymous GET `/api/checkout/orders/[id]` returns 401 and cannot
    reveal order details using only orderNumber or email.
11. Tamper with checkout JSON: set fake price/weight/shipping, invalid region,
    unavailable product or duplicate items. Server must reject or ignore
    untrusted monetary fields.
12. Confirm secrets are absent from HTML, browser network responses, and logs.
13. Test an invalid Midtrans signature and wrong gross_amount. Order/stock MUST
    stay unchanged.
14. Confirm no digital download appears just because a payment is marked PAID.

## Webhook

Configure **Payment Notification URL** in Midtrans merchant dashboard:

```text
https://your-staging-domain.example/api/payments/midtrans/webhook
```

Midtrans cannot reach `http://localhost:3000` from the internet.
Use a dedicated public staging URL/secure tunnel for actual webhook delivery.
`/checkout/confirmation` can refresh server-to-server via Midtrans status API
for local QA, but a deployed webhook is required for reliable automation.

Set Snap **Finish / Error** return URLs to
`https://your-staging-domain.example/checkout/confirmation` in dashboard
if you want automatic return. The URL is just a UI; it never settles a payment.

Midtrans signature is
`SHA512(order_id + status_code + gross_amount + serverKey)`. Successful status
is `settlement` (or `capture` with accepted fraud status). Duplicates are
handled by conditional order transitions inside a serializable transaction.

## Inventory reservation and recovery

- Checkout reserves stock using atomic conditional decrements.
- Verified payment status sets PAID exactly once.
- Verified expiry/cancel/deny sets CANCELLED and releases stock exactly once.
- If Snap token creation **definitively fails**, the server attempts to release
  the inventory and cancel the unpayable order.
- **CRON required before production**: schedule
  `GET /api/internal/payments/reconcile` with
  `Authorization: Bearer $CRON_SECRET` at least hourly.
  It scans up to 25 pending orders older than 3 hours and checks Midtrans
  BEFORE releasing stock. It only cancels when Midtrans has no transaction
  status and the 60-minute Snap page has already expired, or when Midtrans
  confirms a terminal negative status.
- Never blindly cancel a bank-transfer transaction merely because your
  database still says PENDING; the provider may have an active payable code.
- Rate limits implemented at this stage are process-local best effort.
  A shared Redis/database-backed limiter and operational alerts are
  prerequisites for higher-traffic public production release.

## Developer safety gates

- No public endpoint can set `Order.status=PAID`.
- Webhook HMAC-equivalent signature check uses SHA-512 and timing-safe comparison.
- Guest secret is 256 random bits and remains in browser sessionStorage,
  with only its hash in PostgreSQL. It is never placed in URLs.
- Order identity by email is NOT proof of account ownership. Do not grant
  digital file entitlements until a proper buyer-auth workflow exists.
- No raw payment method credentials or digital asset object paths are returned.
- All prices use integer IDR for Midtrans Snap item totals.
- Production mode requires explicit opt-in and additional end-to-end QA.

References:
https://docs.midtrans.com/docs/snap-snap-integration-guide
https://docs.midtrans.com/docs/https-notification-webhooks
https://docs.midtrans.com/docs/get-status-api-requests
https://docs.midtrans.com/docs/snap-advanced-feature

## Digital delivery: paid guest checkout session (new)

A new `POST /api/checkout/orders/[id]/digital-download` endpoint creates a
**60-second private Supabase Storage signed download URL**. It is invoked from
`/checkout/confirmation` and never from a public product page.

Security requirements implemented:
- The client must present `Authorization: Bearer <64-hex-character token>`
  for **this exact order ID**. Only its SHA-256 hash is stored in the Order table.
  A number/email/product ID alone cannot access the file.
- Server requires both a paid/fulfillment-safe order status
  (PAID, PROCESSING, SHIPPED or COMPLETED) and the corresponding
  `PaymentTransaction.state=PAID` with `paidAt` set.
- Server verifies `OrderItem.productType=DIGITAL` and that the requested
  `productId` is part of the purchased order; no unrelated products can be
  downloaded with the same token.
- `requirePrivateBucket()` confirms Supabase Storage bucket is still PRIVATE.
  Download is only signed for that configured bucket and a product-bound path.
- Server never returns the Supabase service key, or a permanent download URL.
  Requests and signed links should never be logged.
- Best-effort process-local limit of 5 signing requests/order/product/minute;
  a shared distributed limiter is needed before high-volume production.

The buyer can now click **Unduh file digital** next to digital line items
once the payment has been verified. The file opens via a temporary signed URL.

**Important limitation:** this feature uses an unguessable *guest checkout
bearer capability*, not a verified customer login. Whoever obtains the browser
session token can access that order while the token remains valid; whoever
obtains an already-signed URL can use it until its 60-second expiry.
An authenticated customer account, device-independent order history, token
rotation/recovery/revocation, download auditing and longer-term entitlements
are mandatory before describing this as verified personal identity or a
complete production-ready digital library. No automated email of access
credentials is provided.

### Digital delivery QA (sandbox and staging)

1. With a paid digital order in the same browser tab used for checkout, open
   `/checkout/confirmation`. Confirm the button **Unduh file digital** appears.
2. Click it and check the correct private PDF/ZIP/image can be downloaded;
   verify the signed URL expires after 60 seconds.
3. Unpaid order: button must not appear, and direct API POST must respond 403.
4. Without a bearer token, direct API POST must respond 401.
5. Use an unrelated order ID, product ID or another checkout token:
   response must not contain a signed URL (404).
6. A paid physical-only order must never sign a digital download.
7. Make the bucket public in a disposable staging environment only;
   confirm download signing refuses to proceed. Restore Private immediately.
8. Check the API response includes only signed URL/filename/TTL and no service
   role credentials. Do not persist or log signed URLs.
9. Reload confirmation in the same tab: guest session persists. A fresh tab or
   browser without this session is intentionally not authorized.
10. Test on localhost and staging; run `npx tsc --noEmit`, `npm run build`,
    and review Vercel deployment before merging PR #7.

# Phase 5 — Admin physical shipment workflow

This is a **fulfillment admin interface**, not a checkout or payment gateway.
No new orders are created and no API sets an unpaid order to PAID.

## Implemented

- `/dashboard/orders` links to the detail page `/dashboard/orders/[id]`.
- Admin order detail shows products, recipient address, order total, saved
  shipment details, courier, service, weight, tracking number, and timestamps.
- Admin PATCH `/api/admin/orders/[id]/shipment` accepts ONLY:
  - `{ "action": "PREPARE", "courier": "JNE", "service": "REG" }`
  - `{ "action": "SHIP", "trackingNumber": "TRACKING12345" }`
  - `{ "action": "DELIVER" }`
- All transitions are server-validated with a serializable Prisma transaction,
  strict input validation, admin JWT session and same-origin request checks.
- The admin **cannot** arbitrarily set shipment status, set an order to PAID,
  change product/checkout prices, or reveal private digital assets.

## State machine

1. **PENDING** (no shipment yet, or existing pending shipment): no tracking number.
   `PREPARE` requires an order in **PAID** or **PROCESSING** and at least one
   physical order item. Admin enters courier and service. If the shipment
   doesn't exist, a shipment snapshot is created using current product weights
   and order-item quantities. On successful prepare, shipment becomes **READY**
   and order becomes **PROCESSING**.
2. **READY** → `SHIP` requires order **PROCESSING**, courier and service
   present and a valid nonempty tracking number. Shipment becomes **SHIPPED**,
   `shippedAt` is set, and the order becomes **SHIPPED**.
3. **SHIPPED** → `DELIVER` requires order **SHIPPED** and recorded tracking.
   Shipment becomes **DELIVERED**, `deliveredAt` is set. A physical-only order
   becomes **COMPLETED**. A mixed physical/digital order remains **SHIPPED**
   because digital entitlement remains unfinished.
4. **RETURNED** is display-only: returns/refunds, automated tracking and
   reopening/reversal transitions are deliberately deferred.

Invalid skips, duplicate status changes, unpaid/cancelled orders and digital-only
orders are rejected with non-success responses.

## Important limitations

- **Checkout and verified payment webhook are not live yet.** Consequently the
  normal storefront cannot generate real PAID orders, so there may be nothing
  to process in the admin until Phase 6. Never fabricate a successful payment
  in production for testing. Use separate seeded *staging* records if needed.
- Courier/service are currently entered manually by admin. They should be
  attached to the **server-requoted selected shipping rate during Phase 6**
  when an order is created, rather than inferred later.
- The package weight for a legacy order without an existing Shipment is
  calculated from current linked Product.weight values. For robust
  historical shipments, Phase 6 must snapshot package weight at order creation;
  if a linked product was deleted or has an invalid weight, preparation fails.
- This phase does **not** buy courier labels, contact the carrier to create
  shipments, automatically verify a tracking number, or send buyer notifications.
  Admin should independently confirm delivery with the courier.
- The OrderStatus enum does not include RETURNED. Do not handle returns and
  refunds by silently mapping them to COMPLETED.

## Manual QA

1. With no orders, visit `/dashboard/orders` and confirm the empty state
   is clear. No fake orders should be created by this feature.
2. On a **backed-up staging database only**, make test orders with the proper
   database relations and a valid physical product weight. Distinguish these
   test records from actual customer payments.
3. For DRAFT / PENDING_PAYMENT / CANCELLED: shipment mutation must be blocked.
4. For a PAID **physical** order, open Detail, enter courier/service, and
   select **READY**. Check that Shipment is created with correct weight and
   the Order becomes PROCESSING.
5. Enter tracking number, select **SHIPPED**, reload page and verify resi,
   courier, shipment status and `shippedAt` are persisted.
6. Select **DELIVERED** and verify the shipment is DELIVERED and a physical-only
   order is COMPLETED. A mixed physical/digital order must NOT automatically
   become COMPLETED.
7. Try skipping READY or submitting an invalid tracking number: expect an
   error, never a successful mutation.
8. Log out; direct GET/PATCH to the admin order APIs must return 403.
9. Confirm price totals, payment status and digital asset contents do not
   change as a side-effect of shipment mutations.
10. Execute `npx prisma generate`, `npx tsc --noEmit`, `npm run build` and
    check the PR's deployment status before merging.

Fase 6 must replace simulated paid order records with real order creation,
server-side payment validation and verified payment gateway webhooks.

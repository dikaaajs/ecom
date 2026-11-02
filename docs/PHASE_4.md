# Phase 4 — Orders & Customer Data (foundation)

This phase starts after Phase 3 was merged into master.

## Implemented
- Prisma models: Customer, CustomerAddress, Order, OrderItem, OrderStatus.
- Historical order-item price/title/type snapshots, independent of later product changes.
- Dedicated SQL migration at `prisma/migrations/20261102133000_phase4_orders/migration.sql`.
- Protected GET `/api/admin/orders?page=1&limit=20&status=DRAFT` and GET `/api/admin/orders/[id]`.
- Admin UI `/dashboard/orders` with count, status filter, pagination, empty/error states.
- Orders link in admin sidebar.

## Explicitly NOT yet implemented
- Buyer registration/login and permissioned customer endpoints.
- Customer address CRUD, order submission or payment acceptance.
- Transactional stock reservations, shipping pricing and payment reconciliation.
- Order status mutations and fulfillment. Do not manually mark an unpaid order paid.

**No endpoint creates orders yet.** The new tables start empty.

## Local verification
1. Point `DATABASE_URL` / `DIRECT_URL` at a **staging database** and back it up.
2. Run `npx prisma migrate deploy` followed by `npx prisma generate`.
3. Run `npx tsc --noEmit` and `npm run build`.
4. Log in as admin. Visit `/dashboard/orders` and verify the empty state.
5. Without an admin session, ensure `/api/admin/orders` and `/api/admin/orders/<id>` reject access.
6. Test filtered pagination when safe staging orders become available.

**Do not merge until migration and build checks pass.** Production migrations should only be deployed after a reviewed backup and schema compatibility check.

## Next
Design the authenticated/guest checkout identity flow, customer data validation, safe order creation, shipping and payment state machine. Customer information must never be exposed by a public order-number lookup.

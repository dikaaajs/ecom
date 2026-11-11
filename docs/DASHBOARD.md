# Store dashboard

The dashboard reads `/api/admin/dashboard?days=7|30|90` (default 30).
Both middleware and the endpoint require an admin session. Responses are
private/no-store. No visitor analytics or sample sales are displayed.

## Metric definitions

- **Pembayaran diterima**: sum of `PaymentTransaction.amount` for state `PAID`,
  non-null `paidAt` inside the selected interval, and IDR orders. Includes
  shipping; excludes unpaid transactions. This is collected gross payments,
  not profit or settlement net of fees/refunds (not tracked in this schema).
- **Pesanan masuk**: orders created inside the selected interval, all statuses.
- **Menunggu pembayaran**: current PENDING_PAYMENT orders, all time.
- **Perlu diproses**: current PAID/PROCESSING orders, all time.
- **Produk/akun**: current product counts, published products, verified buyer
  accounts; no fabricated customer-growth or active-user percentages.
- **Stok**: published PHYSICAL products only. Low stock is 1–5 units; out of
  stock is zero or below. Up to six actionable rows, lowest stock first.
- **Terlaris**: top five order-item snapshots by quantity from payments included
  in the revenue period. Item value excludes shipping. Deleted products retain
  their historical titles and sales. Titles are grouped with product IDs.
- **Pesanan terbaru**: up to eight orders created during the selected period,
  including buyer name and links to order management, without email/address.

Calendar days use Asia/Jakarta (WIB), including today through the request time.
The first day starts at 00:00 WIB. Daily SQL converts Prisma UTC timestamps to
Jakarta dates, and missing dates receive actual zero sales. All dashboard
queries share a read-only repeatable-read snapshot. UI supports loading,
empty/error states, retry, manual refresh, and links to products/orders.
Switching periods cancels the previous request so old results cannot overwrite
the current selection. No schema migration is required.

```powershell
npx.cmd tsx --test scripts/dashboard.test.ts
npx.cmd tsc --noEmit
npm.cmd run build
```

Verified locally: TypeScript, production build and all 12 regression tests pass.
API periods 7/30/90 were compared with database counts; daily revenue and paid
transaction counts match the summary totals. Invalid periods, guests and
non-admin sessions are rejected. These checks do not create orders or payments.

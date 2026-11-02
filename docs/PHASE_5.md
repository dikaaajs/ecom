# Phase 5 — Shipping & Digital Delivery Foundation

This phase builds safe data structures, not a live fulfillment service.

## Implemented
- Shipment model for tracking physical order courier, service, tracking number, and status.
- DigitalAsset model referencing private storage bucket and object path by product.
- Database migration.
- Pure delivery-summary function separating physical and digital items.
- Cart quote reports whether shipping is needed, required address, and weight, with no invented courier cost.

## Security expectations
- Digital assets must be stored in a **private** Supabase Storage bucket, never in public URLs or Next.js /public.
- No public API serves asset object paths or signed download URLs.
- A future download handler must authenticate the buyer, verify ownership and paid order state on the server, and issue a short-lived signed URL.
- Never permit public order lookup using only orderNumber or email.
- Shipping rate must be calculated server-side from a trusted provider, not from a browser-submitted price.
- Do not mark paid orders or dispatch files until a trusted payment webhook is verified.

## Before merge
1. Set DATABASE_URL/DIRECT_URL to a backed-up staging DB.
2. Run `npx prisma migrate deploy`, `npx prisma generate`, `npx tsc --noEmit`, `npm run build`.
3. Test physical-only, digital-only, and mixed carts using `POST /api/cart/quote`.
4. Verify no digital asset storage details leak from public APIs.
5. Confirm database migration and deployment checks succeed.

## Next integration
Select a shipping rate provider and configure its credentials via environment variables. Complete checkout and payment verification first, then implement authenticated file redemption and shipment status transitions.

## Shipping setup readiness / checkout guard

- Admin dashboard now displays `ShippingSetupNotice`, loaded from the authenticated `/api/admin/shipping-origin` endpoint.
- Missing origin: amber notice with a link to `/dashboard/settings/shipping`.
- Saved valid origin: green status with a link to edit it.
- API `POST /api/cart/quote` now reports `shippingOriginConfigured`, `checkoutReady: false`, and machine-readable `checkoutBlockers`.
- Physical items with no origin include `SHIPPING_ORIGIN_MISSING`; physical carts also include `SHIPPING_RATE_UNAVAILABLE` until a trusted provider is fully connected.
- Digital-only carts do not require a shipping origin. Checkout remains globally disabled because order submission and payment are not yet built.
- The public quote never returns the full warehouse address or coordinates; it exposes only a readiness boolean.
- Important: the quote is advisory, NOT the final checkout authorization. The future order-creation API **must re-read** origin, shipping rates, stock and prices on the server and enforce the same conditions immediately before creating an order.

### Test matrix
1. In staging, before saving an origin, admin dashboard shows amber notice.
2. Physical cart has `shippingOriginConfigured: false` and `SHIPPING_ORIGIN_MISSING` in `checkoutBlockers`. Checkout remains unavailable.
3. Digital-only cart is independent of origin configuration but still has `CHECKOUT_NOT_IMPLEMENTED` until payment/order flow is implemented.
4. Save valid address and map pin in admin, reload dashboard: green notice appears.
5. Physical quote has `shippingOriginConfigured: true` and still reports missing courier rates (until provider integration).
6. Public `/api/settings` and `/api/cart/quote` do not expose sender phone, warehouse street, or coordinates.

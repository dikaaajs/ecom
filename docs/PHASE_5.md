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

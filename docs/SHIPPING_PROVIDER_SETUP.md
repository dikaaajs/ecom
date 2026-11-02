# RajaOngkir / Komerce shipping setup (Phase 5)

Server-only adapter: `lib/shipping/rajaongkir.ts`.

## Required from store owner
- Pickup origin is now configured by the merchant at `/dashboard/settings/shipping` using a full address and map pin. The courier-specific numeric `originId` must be resolved from the saved city/district by the provider integration (not typed by the merchant).
- Allowed couriers (e.g. `jne:jnt:sicepat`), limited to account-supported couriers.
- RajaOngkir Shipping Cost API key, configured privately.
- Confirmation of active Shipping Cost API access and staging/development environment.

## Environment (server only)
```dotenv
RAJAONGKIR_API_KEY=your_key_here
RAJAONGKIR_COURIERS=jne:jnt:sicepat
```
**Never commit real values** to GitHub, paste keys into chat, or expose them through NEXT_PUBLIC_ variables.

## Status / safety
- The adapter is a **preparatory integration**, not wired to a public endpoint or checkout yet.
- No real shipping rates have been retrieved or validated against this account.
- The cart still shows "Pending courier rate" until the location and provider are configured.
- Provider failures throw errors; they must never be silently converted to free shipping.
- Before exposing to a public route: verify provider response format with a staging key, add per-IP/user rate limiting to avoid API quota abuse, and enforce server-calculated weight based on current product records.
- Do not accept browser-provided price, weight, origin, or rate as authoritative.
- Payments, order submission and shipping booking are still disabled.

Official documentation: https://www.rajaongkir.com/docs/shipping-cost/endpoint-rajaongkir-for-search-base/calculate-domestic-cost

## Merchant shipping origin panel

Admin: `/dashboard/settings/shipping` — fill sender name, phone, province, city, district, village, street and house number, postal code, optional courier notes. Set a pin on the interactive OSM map (or opt in to browser geolocation) and save.

The data is stored as JSON in the existing `site_settings` table under `shippingOrigin` and is accessible only through the admin-authorized `/api/admin/shipping-origin` route. No new migration or extra API key is necessary for this panel. The private merchant location is not exposed to storefront buyers.

**Important:** latitude/longitude is not a RajaOngkir origin ID. A future rate-quote endpoint must resolve and validate the provider origin ID using the saved city/district, never trust a user-provided origin ID or read a hard-coded origin ID from environment variables. Live courier rates remain disabled.

OSM map tiles are third-party assets; follow [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/). For a high-traffic SaaS deployment, provision a commercial tile provider and handle privacy requirements.

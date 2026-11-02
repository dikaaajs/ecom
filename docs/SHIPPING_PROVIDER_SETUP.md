# RajaOngkir / Komerce shipping setup (Phase 5)

Server-only adapter: `lib/shipping/rajaongkir.ts`.

## Required from store owner
- Pickup origin is configured by the merchant at `/dashboard/settings/shipping` using the live RajaOngkir province → city → district dropdowns, full address, and map pin. The numeric district ID is saved with the merchant address and validated by the server.
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
- The region endpoints have been implemented based on current official API docs, but **not tested with a real API key**. No real shipping rates have been retrieved or validated against this account.
- The cart still shows "Pending courier rate" until the location and provider are configured.
- Provider failures throw errors; they must never be silently converted to free shipping.
- Before exposing to a public route: verify provider response format with a staging key, add per-IP/user rate limiting to avoid API quota abuse, and enforce server-calculated weight based on current product records.
- Do not accept browser-provided price, weight, origin, or rate as authoritative.
- Payments, order submission and shipping booking are still disabled.

Official documentation: https://www.rajaongkir.com/docs/shipping-cost/endpoint-rajaongkir-for-search-base/calculate-domestic-cost

## Merchant shipping origin panel

Admin: `/dashboard/settings/shipping` — fill sender name, phone, province, city, district, village, street and house number, postal code, optional courier notes. Set a pin on the interactive OSM map (or opt in to browser geolocation) and save.

The data is stored as JSON in the existing `site_settings` table under `shippingOrigin` and is accessible only through the admin-authorized `/api/admin/shipping-origin` route. No new migration or extra API key is necessary for this panel. The private merchant location is not exposed to storefront buyers.

**Important:** latitude/longitude is not a RajaOngkir origin ID. The admin saves a validated `districtId` for the future shipping cost calculation, and buyer draft stores provider region IDs. Live courier rates are **not** enabled yet. Future order creation must verify buyer IDs and shipping prices on the server; never trust the draft alone.

OSM map tiles are third-party assets; follow [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/). For a high-traffic SaaS deployment, provision a commercial tile provider and handle privacy requirements.

## Live cascading region API (implemented)

- Public GET `/api/shipping/regions?level=province` fetches `destination/province`.
- GET `?level=city&parentId=PROVINCE_ID` fetches `destination/city/{province_id}`.
- GET `?level=district&parentId=CITY_ID` fetches `destination/district/{city_id}`.
- Browser receives only `id/name/zipCode` lists, **never the API key**; requests use a server-side `key` header.
- The merchant's `/api/admin/shipping-origin` PUT validates the selected province/city/district chain against RajaOngkir before saving. Older merchant addresses are loaded for editing but require a new dropdown selection to become courier-ready.
- Guest address drafts store selected names and IDs in sessionStorage and will be verified again in the future protected order/quote flow.
- A best-effort process-local request limiter and response caching are included to reduce the Starter quota impact; **use a shared limiter and monitor API quota in production**.
- If the key is missing/invalid, the UI shows a failure with retry rather than inventing region IDs or allowing a fake origin to be saved.

References:
- https://www.rajaongkir.com/docs/shipping-cost/endpoint-rajaongkir-for-form-base-calculate-cost/search_province
- https://www.rajaongkir.com/docs/shipping-cost/endpoint-rajaongkir-for-form-base-calculate-cost/search_city
- https://www.rajaongkir.com/docs/shipping-cost/endpoint-rajaongkir-for-form-base-calculate-cost/search_district

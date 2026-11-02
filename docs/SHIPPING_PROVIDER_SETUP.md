# RajaOngkir / Komerce shipping setup (Phase 5)

Server-only adapter: `lib/shipping/rajaongkir.ts`.

## Required from store owner
- Pickup origin (city/subdistrict), then resolve numeric `originId` using official destination lookup.
- Allowed couriers (e.g. `jne:jnt:sicepat`), limited to account-supported couriers.
- RajaOngkir Shipping Cost API key, configured privately.
- Confirmation of active Shipping Cost API access and staging/development environment.

## Environment (server only)
```dotenv
RAJAONGKIR_API_KEY=your_key_here
RAJAONGKIR_ORIGIN_ID=your_origin_id
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

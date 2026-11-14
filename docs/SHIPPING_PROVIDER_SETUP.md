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

## Live courier rates in checkout (Phase 5 preview)

The first live rate integration is now implemented **for preview only**:

- Add physical or mixed products to cart, visit `/checkout`, fill and **Simpan alamat sementara**.
- Select valid RajaOngkir province, city and district, then click **Cek ongkir**.
- The browser sends only product IDs/quantities and the public destination region ID/name selection to `POST /api/shipping/rates`. It never sends buyer name, street, phone, email, coordinates, or any API key to that endpoint.
- The server reloads current products, publication, prices, quantities, available stock and weights from Prisma; derives origin district ID from saved admin settings; validates destination region hierarchy; and requests real rates from RajaOngkir's step-by-step **district** cost endpoint.
- Options include courier, service, provider price and ETA if supplied. Clicking one shows an **estimated** total; no order or payment is processed.
- Rate estimates are cached **in-process** for five minutes, and requests use a best-effort **per-process** rate cap (15 checks/hour per IP). This is **not a distributed rate limit** and must be replaced by a shared quota/rate limiter before a public production rollout with a limited RajaOngkir account.
- Server errors, missing warehouse configuration, invalid destination, unsupported couriers, depleted stock and invalid product weight fail closed. There is no fake cost or free-shipping fallback.

Environment variables (only on the server):

```dotenv
RAJAONGKIR_API_KEY=your_shipping_cost_key
RAJAONGKIR_COURIERS=jne:jnt:sicepat:anteraja
```

Your Shipping Cost API account must support the courier codes selected above. Remove unsupported courier codes from `RAJAONGKIR_COURIERS`.

**Before merging:** Confirm the real Shipping Cost API response against the connected RajaOngkir account. A valid dropdown API key is encouraging but does not guarantee that the rate endpoint or all couriers are available.

### Manual shipping-rate QA

1. Check `/dashboard/settings/shipping` has a saved province/city/district from RajaOngkir and a valid map pin.
2. Add a physical product of known weight; checkout, fill a valid buyer address and save the draft.
3. Click `Cek ongkir`; compare the returned courier codes/service, rate and ETA with the RajaOngkir dashboard or an official live quote.
4. Select an option; verify the shipping cost and estimated total update without placing an order.
5. Change destination district or change the cart; check previously selected rate disappears and requires another explicit quote.
6. Mix digital and physical items; shipping weight must exclude digital items.
7. Test digital-only cart; it skips the delivery form and does not request courier rates.
8. Unpublish a product, exceed stock, or remove origin; the endpoint must reject the preview without pricing.
9. Test invalid region IDs and API key failure; no `0` shipping fallback.
10. Open browser network tab: requests to `/api/shipping/rates` must contain no private buyer contact/address data or API token.
11. Run `npx tsc --noEmit` and `npm run build` before merging, including on Vercel.
12. Monitor the RajaOngkir account's API quota on staging; remove rate requests from the public storefront if quota or account capability is insufficient.

The shipping preview **is not a payment quote**: before creating an order, the payment phase must re-validate the selected courier, rate, buyer region and catalog data on the server, and bind the payable amount to that verified quote.

# Buyer Delivery Address — Phase 5

## What is implemented
- From the cart, valid physical and digital carts can open `/checkout` **in preview mode**. It is not a payment or order-submission flow.
- Physical or mixed carts display the Indonesian buyer delivery form with recipient, phone, email, province, city, district, village, postal code, full street address, and optional courier notes.
- An **optional OpenStreetMap pin** can be placed by clicking/dragging the map or by using the user's browser location with permission.
- Zod validates the draft before it can be saved. There is a **clear** action.
- The draft is saved explicitly to **sessionStorage in the current browser tab**; nothing is saved to the customer/order database or posted to the shipping provider at this stage.
- Digital-only carts skip the shipping address form entirely.
- Prices, inventory and physical/digital classification are re-fetched from the backend `POST /api/cart/quote`. Unavailable cart items block the preview.
- Missing merchant shipping origin produces a notice for physical goods. The buyer may still enter a **draft** address, but **no checkout/order/payment is possible**.
- Payment remains disabled for every cart type; no order creation and no external transfers occur.

## Manual test checklist
1. Pull `feat/phase-5-shipping-digital-delivery`, run `npx prisma generate`, `npx tsc --noEmit`, `npm run build`.
2. Add a physical item; on `/cart`, click **Isi alamat pembeli** and verify the form opens at `/checkout`.
3. Submit an empty form; check required fields. Test malformed email, phone, or postal code (must be five digits).
4. Fill form, optionally click and drag map pin, select **Simpan alamat sementara**. Reload checkout in the **same tab**; values and pin should persist.
5. Click **Hapus**; reload and confirm no stored draft remains.
6. Disable browser geolocation; use the optional map manually, or leave pin unset and still save a valid written address.
7. Add only digital items; open checkout and confirm the address form is absent and no shipping fee is required.
8. Mix physical and digital items; confirm address is required for the physical portion and parcel weight ignores digital goods.
9. Remove/unpublish a cart item or exceed stock; checkout preview should block and link back to cart.
10. Clear the merchant shipping origin on staging (or test with an unconfigured staging DB); confirm physical checkout displays a warning but allows address **draft** only.
11. Confirm network tab does not show personal address data in public quote requests; the draft remains in this tab's `sessionStorage`.
12. Confirm there is no operational pay/place-order button.

## Privacy & integration boundaries
- This is a **temporary guest draft**, not a verified shipping address or a permanent customer profile. SessionStorage is readable by scripts on the same origin, so avoid third-party scripts with unnecessary privileges. For production, implement a customer identity flow, secure server-side validation, consent-aware persistence and retention policies.
- Client validation does not replace server validation: future order creation must validate the recipient, phone, address and provider territory IDs against trusted data.
- Province/city/district fields are **free text for preview**. They are not RajaOngkir territory IDs. The actual shipping-rate integration must use selectable verified provider locations.
- Never put customer PII in URLs, analytics, console logs, public site settings, or a git repository.

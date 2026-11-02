# Phase 5: private digital product storage

## Why this exists

A merchant must be able to upload downloadable product content without ever
putting it in `public/`, a public storage bucket, or a public product JSON response.

Current scope: **authenticated admin upload + private metadata only**.
Customer download is **intentionally not available** until the future checkout/payment
phase implements a trusted paid-order check **and buyer authentication/ownership**.

## Configure Supabase Storage

1. Open your own Supabase project → Storage → **New bucket**.
2. Name it `digital-products` and select **Private** (public access must be OFF).
3. Verify the private setting in Supabase before uploading.
4. Set these **server-side environment variables** in `.env.local` (and Vercel's server env settings if deployed):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_private_service_role_key
SUPABASE_DIGITAL_BUCKET=digital-products
```

The Supabase URL can be public. The **service role key must never be in a `NEXT_PUBLIC_` variable,
GitHub, screenshots, browser JavaScript, or this chat**.
Restart `npm run dev` after changing environment variables.

The admin API checks `getBucket(...).public === false` before writing
and **fails closed** if the bucket is not private.

## Merchant workflow

1. Create products with `type=DIGITAL` in the existing Product admin area.
2. Open Dashboard → **File Digital** (`/dashboard/digital-assets`).
3. Select a product and upload a PDF, ZIP, PNG, JPG/JPEG, or WEBP file.
4. Review the green confirmation and the recorded private filename.
5. Replacing an existing file is allowed **only when the product has no paid/fulfilled orders**.
   Real versioned files and historical customer entitlements are not yet implemented.

Each upload is tied to the `DigitalAsset` record via `productId`, with a random
server-generated storage path. Files are stored in Supabase Storage and not in
PostgreSQL. The admin JSON response contains safe display metadata but
**not** `bucket`, `objectPath`, storage tokens, or signed URLs.

## Current size limitation

This starter implementation uploads small files through a Next.js Route Handler.
The cap is **4 MiB per file** because Vercel Functions allow a total request payload
of up to **4.5 MB**. For files larger than that, implement an admin-authorized
direct-to-private-storage upload workflow and complete it with server-side
verification before persisting the asset. Do not increase the route body limit
and assume Vercel will accept a large upload.

## Security behavior

- Admin authentication is required for listing and uploading.
- Uploads must be same-origin multipart form requests and contain a valid digital product.
- Extension and file signature are checked (PDF, ZIP, PNG, JPEG, WEBP).
- Public product and cart APIs do **not** expose private storage paths.
- Cart quotes now include `DIGITAL_ASSET_MISSING` in `checkoutBlockers` if any
  digital product has no registered private file. No buyer download is offered.
- Existing paid orders block in-place file replacement, avoiding silent changes
  to a historical paid entitlement (full versioning is deferred).

## Manual QA

1. Open `/dashboard/digital-assets` while logged in as admin. Confirm digital products appear.
2. Log out and request `/api/admin/digital-assets`. Expect 403.
3. Create a private Supabase bucket and configure the credentials.
4. Upload a small valid PDF or ZIP. Verify the filename appears after refresh.
5. Check the Supabase Storage dashboard: object resides in the **private** bucket.
6. Change the bucket to public in staging, then try uploading. Expect an error,
   not a success (return bucket to private immediately).
7. Try a file above 4 MiB and an unsupported type (.exe). Both must be rejected.
8. Confirm anonymous `/api/products`, `/api/cart/quote`, and the
   storefront do not leak bucket paths, access tokens, or signed URLs.
9. Try a digital product without an asset; the cart/checkout should warn
   that fulfillment is not ready.
10. Run `npx prisma generate`, `npx tsc --noEmit`, `npm run build`.
11. Do **not** enable actual buyer downloads until a verified payment event
    and authenticated ownership checks are available.

Reference:
- Supabase private buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase downloads: https://supabase.com/docs/guides/storage/serving/downloads
- Vercel payload limit: https://vercel.com/docs/functions/limitations

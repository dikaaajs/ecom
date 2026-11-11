# Website customization

Open **Dashboard → Pengaturan Website** (`/dashboard/settings`) as an admin.
The form loads saved values, shows a live preview, and saves only when **Simpan
perubahan** is clicked. Resetting to defaults changes the draft first. Uploads
produce an image URL; save the draft afterward to publish the selected image.

Available controls:

- Store name, search description, logo and favicon.
- Page background/text, primary button/background text, footer colors.
- Home hero image, overlay, title, description, CTA text/link and announcement.
- Collection heading/description, footer description and public contacts.
- Optional store-location section, photo, public address and HTTPS map link.
- Optional FAQ with up to 20 editable questions and answers.
- Instagram, Facebook, YouTube and Twitter links; empty links are hidden.

Images can use HTTPS URLs, paths to files in `public/`, or direct uploads.
Direct uploads require server-side `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. The admin-only upload endpoint creates a dedicated
**public** `storefront-media` bucket if absent; private digital-delivery storage
is never used or made public. PNG/JPEG/WEBP/GIF/ICO files are limited to 2 MB
and checked by signature; SVG is not accepted. Uploaded images are public
assets. Unused uploads remain in storage for manual cleanup.

Settings persist in the existing `SiteSetting` table; no migration or seed is
required. Clones get defaults from `lib/site-settings.ts` and can customize their
own databases. Existing valid settings are retained; invalid legacy fields
fall back individually. Warehouse/shipping-origin settings are not public.

`GET /api/settings` returns an explicit allowlist. `PUT /api/settings` requires
an admin session and validates fields, URLs, lengths, colors and value types;
updates are atomic. Private or unknown keys are rejected. Public responses use
no-store caching. Server rendering and metadata read current settings on each
request, with defaults if the database is unavailable. Refresh an already-open
store page to see changes saved from another tab. No custom HTML, CSS or scripts
can be injected through these settings.

Customization covers the storefront's identity, homepage content, page theme,
primary storefront buttons, footer, and metadata. Fixed checkout/payment text,
transactional email templates, dashboard controls and product content remain
managed by their own flows. This is not a drag-and-drop page builder.

Validation:

```powershell
npx.cmd tsx --test scripts/site-settings.test.ts scripts/account-security.test.ts
npx.cmd tsc --noEmit
npm.cmd run build
```

On Windows, stop the local dev server before Prisma generation/build if the
Prisma engine DLL is locked, then restart `npm.cmd run dev` afterward.

Verified on the configured database/storage: six automated regression tests,
TypeScript and production build; public settings allowlist; rejection of
unauthenticated, cross-origin and invalid updates; admin save/read of the same
public settings; settings-page and storefront HTTP rendering; rejection of a
fake PNG; successful real PNG upload and public retrieval. The test upload was
removed afterward. The existing public values were preserved when testing save.

# Preview catalog seed

This is an **optional development/staging-only** seed for visual review of the storefront and cart.

- Inserts **12 products**: 8 physical and 4 digital.
- Prices are in **IDR**. Includes categories, tags, stock, product types, and sample images.
- Uses unique slugs prefixed with `demo-preview-`.
- **Idempotent:** running twice skips existing demo products and does not overwrite real products or existing demo edits.
- No admin user or site settings are modified; no migration is required.
- Images from Unsplash are illustrative stock photos, not actual merchandise, and may depend on remote image availability.
- Digital listings contain preview metadata only: no paid downloadable files or fulfillment are set up yet.
- Never run against the production database. Verify `DATABASE_URL` and `DIRECT_URL` point to **development or staging**.

## Run from Windows PowerShell

```powershell
git switch feat/phase-3-cart-checkout
git pull --ff-only
npx prisma generate
$env:CONFIRM_DEMO_SEED="yes"
npm run db:seed:preview
Remove-Item Env:CONFIRM_DEMO_SEED
npm run dev
```

If using Bash instead:

```bash
CONFIRM_DEMO_SEED=yes npm run db:seed:preview
```

The standard `npm run db:seed` script is unchanged.

Preview at `/`, `/product`, and `/cart`. For cart testing, add an item from a product detail page. The checkout remains disabled until order processing is implemented.

To clean up later, delete only products with slugs starting `demo-preview-` through an explicit admin/database action after reviewing the target database. The seed does not auto-delete any data.

# Phase 1 — Security and product foundation

## Implemented
- NextAuth authentication for dashboard/admin routes and server-side admin role checks.
- Product catalog public GET is read-only and excludes unpublished products.
- Protected product CRUD, categories/tags mutations, and store-settings PUT.
- Product input validation with Zod and extracted service layer.
- Product type selector (PHYSICAL/DIGITAL) in admin form.
- Physical items require a positive weight; digital items do not require shipping dimensions.
- Prisma enum and backward-compatible migration; old products default to PHYSICAL.
- Shared product response type; fix publish toggle and stock filtering.

## Required validation before merging
This branch has not been built, deployed, or tested against a database in the present environment.
Clone the branch and configure local environment variables, then run:

```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npx tsc --noEmit
npm run build
```

Use a disposable or backed-up test database for the migration. Do not execute migration against production until verified.

### Manual regression checks
1. Signed-out POST/PUT/PATCH/DELETE to admin endpoints and PUT /api/settings are rejected.
2. Signed-in admin can create, edit, unpublish, and delete physical and digital products.
3. Physical products require weight; digital products accept weight 0.
4. Categories and tags can be created/edited/deleted by admin and not by anonymous users.
5. Public product APIs exclude unpublished items.
6. Existing products retain all data after migration and default to PHYSICAL.
7. Admin can update store settings.
8. Inspect all remaining routes for authorization gaps.

## Not part of Phase 1
Cart, checkout, payment, shipping API, digital fulfillment and file storage.

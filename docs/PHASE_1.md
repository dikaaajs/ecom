# Phase 1 — Foundation & security

## Changes
- Restore authentication and admin-role checks for dashboard and /api/admin routes.
- Add server-side session checks to admin product operations and category/tag mutations.
- Public product API is read-only and hides unpublished products.
- Product publish toggle now uses protected PATCH /api/admin/products/:id.
- Share product API response type outside dashboard.
- Support PHYSICAL and DIGITAL types in the Prisma schema (existing products default to PHYSICAL).
- Fix stock filtering to use stock > 0.

## Migration
Back up the production database first. Then run:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
```

Ensure DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET and NEXTAUTH_URL are configured. Never commit .env files.

## Required verification
1. Unauthenticated users cannot modify products, categories or tags.
2. Admin can sign in, create/edit/delete products, categories and tags.
3. Publishing/unpublishing affects public catalog visibility.
4. Existing products remain PHYSICAL after migration.
5. Confirm create/edit, search, and storefront on a test database.

## Remaining work
- Audit other public mutation endpoints beyond products/categories/tags.
- Add Zod schemas and business-layer validation for all mutations.
- Add digital product selection to admin form.
- Write automated authorization and integration tests.
- Verify the application build and migrations against a test database before merging.

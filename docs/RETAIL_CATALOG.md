# Retail catalog replacement

The catalog in `data/retail-catalog.json` contains nine real Logitech models.
IDR prices were checked against Logitech Indonesia on 11 November 2026.
Each entry records its product page and exact product photo URL. Prices are
a dated reference, not a live price feed or a reseller/stock certification.
Photos remain hosted by Logitech and may change; check permission before
commercial reuse. Product descriptions are concise original summaries.

Stock is **sample inventory: 10 units per product**, explicitly requested by the
store owner. Shipping weights are conservative package estimates, not verified
manufacturer package measurements; replace them with actual packed weights
before live shipping. All new entries are physical products.

## Commands

Preview counts without modifying data:

```powershell
node --env-file=.env --import tsx scripts/replace-catalog.ts
```

Replace **all existing products** in the database configured in `.env`:

```powershell
node --env-file=.env --import tsx scripts/replace-catalog.ts --apply
```

Uses `DIRECT_URL` when present. Requires Node.js with `--env-file` support.
Before deleting anything, the script validates the manifest and remote photos,
then writes the previous products, images, categories, tags and digital-asset
metadata into an ignored local `.catalog-backups/catalog-*.json` file. This is
a catalog export, not a complete database backup or automatic restore tool.

Deletion and insertion share one serializable transaction. Orders and order
items are retained; their old product references become null through the
existing foreign key, while purchased titles, quantities and prices remain.
The script refuses replacement if a digital asset has associated order items.
Unused categories/tags are removed so obsolete demo filters disappear.
Digital storage objects are not deleted from Supabase.

The older `db:seed` and `db:seed:preview` commands still contain legacy demo
products; do not run them to populate this retail catalog.

Sources: [Logitech Indonesia](https://www.logitech.com/id-id/shop), plus the
per-product `sourceUrl` fields in the manifest. No schema migration is needed.

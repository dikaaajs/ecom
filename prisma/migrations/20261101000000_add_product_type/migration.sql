-- Existing products are physical by default. No existing product rows are deleted.
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL');
ALTER TABLE "products" ADD COLUMN "type" "ProductType" NOT NULL DEFAULT 'PHYSICAL';
ALTER TABLE "products" ALTER COLUMN "weight" SET DEFAULT 0;

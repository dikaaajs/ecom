CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING','READY','SHIPPED','DELIVERED','RETURNED');

CREATE TABLE "shipments" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
  "courier" TEXT,
  "service" TEXT,
  "trackingNumber" TEXT,
  "totalWeightGram" INTEGER NOT NULL,
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "shipments_orderId_key" ON "shipments"("orderId");
CREATE INDEX "shipments_status_idx" ON "shipments"("status");
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "digital_assets" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "objectPath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "digital_assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "digital_assets_productId_key" ON "digital_assets"("productId");
ALTER TABLE "digital_assets" ADD CONSTRAINT "digital_assets_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guest access tokens are stored ONLY as SHA-256 hashes.
ALTER TABLE "orders"
  ADD COLUMN "checkoutAccessHash" TEXT,
  ADD COLUMN "destinationDistrictId" INTEGER;

CREATE UNIQUE INDEX "orders_checkoutAccessHash_key" ON "orders"("checkoutAccessHash");

CREATE TYPE "PaymentState" AS ENUM ('INITIALIZING', 'PENDING', 'PAID', 'CANCELLED');

CREATE TABLE "payment_transactions" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'MIDTRANS',
  "providerOrderId" TEXT NOT NULL,
  "state" "PaymentState" NOT NULL DEFAULT 'INITIALIZING',
  "amount" DECIMAL(12,2) NOT NULL,
  "redirectUrl" TEXT,
  "paidAt" TIMESTAMP(3),
  "lastNotificationAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_transactions_orderId_key" ON "payment_transactions"("orderId");
CREATE UNIQUE INDEX "payment_transactions_providerOrderId_key" ON "payment_transactions"("providerOrderId");
CREATE INDEX "payment_transactions_state_createdAt_idx" ON "payment_transactions"("state", "createdAt");

ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

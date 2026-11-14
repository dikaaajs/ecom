CREATE TABLE "customer_accounts" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_accounts_customerId_key" ON "customer_accounts"("customerId");
CREATE UNIQUE INDEX "customer_accounts_email_key" ON "customer_accounts"("email");
ALTER TABLE "customer_accounts" ADD CONSTRAINT "customer_accounts_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

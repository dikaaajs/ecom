ALTER TABLE "customer_accounts" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "customer_accounts" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TYPE "AccountTokenPurpose" AS ENUM ('VERIFY_EMAIL','RESET_PASSWORD');
CREATE TABLE "account_action_tokens" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "purpose" "AccountTokenPurpose" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_action_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "account_action_tokens_tokenHash_key" ON "account_action_tokens"("tokenHash");
CREATE INDEX "account_action_tokens_accountId_purpose_createdAt_idx" ON "account_action_tokens"("accountId","purpose","createdAt");
CREATE INDEX "account_action_tokens_expiresAt_idx" ON "account_action_tokens"("expiresAt");

CREATE TABLE "auth_rate_limits" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "auth_rate_limits_expiresAt_idx" ON "auth_rate_limits"("expiresAt");

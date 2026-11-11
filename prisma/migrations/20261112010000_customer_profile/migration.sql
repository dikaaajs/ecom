ALTER TABLE "customers" ADD COLUMN "avatarPath" TEXT;
ALTER TYPE "AccountTokenPurpose" ADD VALUE 'CHANGE_EMAIL';
ALTER TABLE "account_action_tokens" ADD COLUMN "targetEmail" TEXT;
ALTER TABLE "account_action_tokens" ADD COLUMN "sessionVersion" INTEGER;

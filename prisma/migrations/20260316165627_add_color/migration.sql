-- CreateEnum
CREATE TYPE "public"."TagColor" AS ENUM ('SLATE', 'GRAY', 'ZINC', 'NEUTRAL', 'STONE', 'RED', 'ORANGE', 'AMBER', 'YELLOW', 'LIME', 'GREEN', 'EMERALD', 'TEAL', 'CYAN', 'SKY', 'BLUE', 'INDIGO', 'VIOLET', 'PURPLE', 'FUCHSIA', 'PINK', 'ROSE');

-- AlterTable
ALTER TABLE "public"."tags" ADD COLUMN     "color" "public"."TagColor" NOT NULL DEFAULT 'GRAY';

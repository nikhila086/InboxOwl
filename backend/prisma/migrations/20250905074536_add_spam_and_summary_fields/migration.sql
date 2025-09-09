-- AlterTable
ALTER TABLE "public"."Email" ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "fullContent" TEXT,
ADD COLUMN     "spamReasons" JSONB,
ADD COLUMN     "spamScore" DOUBLE PRECISION,
ADD COLUMN     "summarizedAt" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT;

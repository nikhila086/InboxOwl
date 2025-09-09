/*
  Warnings:

  - You are about to drop the column `analyzedAt` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `fullContent` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `spamReasons` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `spamScore` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `summarizedAt` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Email` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Email" DROP COLUMN "analyzedAt",
DROP COLUMN "fullContent",
DROP COLUMN "spamReasons",
DROP COLUMN "spamScore",
DROP COLUMN "summarizedAt",
DROP COLUMN "summary";

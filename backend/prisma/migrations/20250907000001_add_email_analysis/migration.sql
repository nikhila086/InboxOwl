-- CreateTable
CREATE TABLE "EmailAnalysis" (
    "id" SERIAL NOT NULL,
    "emailId" TEXT NOT NULL,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "spamScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasons" TEXT[],
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAnalysis_pkey" PRIMARY KEY ("id")
);

-- AddUniqueConstraint
ALTER TABLE "EmailAnalysis" ADD CONSTRAINT "EmailAnalysis_emailId_key" UNIQUE ("emailId");

-- AddForeignKey
ALTER TABLE "EmailAnalysis" ADD CONSTRAINT "EmailAnalysis_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

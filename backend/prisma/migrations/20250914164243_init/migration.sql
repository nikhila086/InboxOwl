-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Email" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "to" TEXT,
    "snippet" TEXT NOT NULL,
    "content" TEXT,
    "labels" TEXT[],
    "date" TIMESTAMP(3) NOT NULL,
    "threadId" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366F1',
    "description" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailAnalysis" (
    "id" SERIAL NOT NULL,
    "emailId" TEXT NOT NULL,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "spamScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasons" TEXT[],
    "summary" TEXT,
    "category" TEXT,
    "categoryId" INTEGER,
    "confidence" DOUBLE PRECISION,
    "aiModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lastHistoryId" TEXT,
    "lastSyncTime" TIMESTAMP(3),
    "syncFrequency" INTEGER NOT NULL DEFAULT 300,
    "autoCategories" BOOLEAN NOT NULL DEFAULT true,
    "spamDetection" BOOLEAN NOT NULL DEFAULT true,
    "aiSummaries" BOOLEAN NOT NULL DEFAULT true,
    "maxEmailsPerSync" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SyncCache" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_EmailCategories" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EmailCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Email_externalId_key" ON "public"."Email"("externalId");

-- CreateIndex
CREATE INDEX "Email_userId_idx" ON "public"."Email"("userId");

-- CreateIndex
CREATE INDEX "Email_date_idx" ON "public"."Email"("date");

-- CreateIndex
CREATE INDEX "Email_externalId_idx" ON "public"."Email"("externalId");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "public"."Category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_userId_key" ON "public"."Category"("name", "userId");

-- CreateIndex
CREATE INDEX "Rule_userId_idx" ON "public"."Rule"("userId");

-- CreateIndex
CREATE INDEX "Rule_categoryId_idx" ON "public"."Rule"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_name_userId_key" ON "public"."Rule"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAnalysis_emailId_key" ON "public"."EmailAnalysis"("emailId");

-- CreateIndex
CREATE INDEX "EmailAnalysis_emailId_idx" ON "public"."EmailAnalysis"("emailId");

-- CreateIndex
CREATE INDEX "EmailAnalysis_isSpam_idx" ON "public"."EmailAnalysis"("isSpam");

-- CreateIndex
CREATE INDEX "EmailAnalysis_spamScore_idx" ON "public"."EmailAnalysis"("spamScore");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "public"."UserSettings"("userId");

-- CreateIndex
CREATE INDEX "SyncCache_userId_idx" ON "public"."SyncCache"("userId");

-- CreateIndex
CREATE INDEX "SyncCache_expiresAt_idx" ON "public"."SyncCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncCache_userId_cacheKey_key" ON "public"."SyncCache"("userId", "cacheKey");

-- CreateIndex
CREATE INDEX "_EmailCategories_B_index" ON "public"."_EmailCategories"("B");

-- AddForeignKey
ALTER TABLE "public"."Email" ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rule" ADD CONSTRAINT "Rule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rule" ADD CONSTRAINT "Rule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailAnalysis" ADD CONSTRAINT "EmailAnalysis_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "public"."Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EmailCategories" ADD CONSTRAINT "_EmailCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_EmailCategories" ADD CONSTRAINT "_EmailCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

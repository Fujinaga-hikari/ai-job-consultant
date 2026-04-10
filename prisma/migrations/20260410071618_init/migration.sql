-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "salary" TEXT,
    "location" TEXT,
    "content" TEXT NOT NULL,
    "persona" TEXT,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "companyName" TEXT,
    "preferredTime" TEXT,
    "generationLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_generationLogId_fkey" FOREIGN KEY ("generationLogId") REFERENCES "GenerationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "entityName" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

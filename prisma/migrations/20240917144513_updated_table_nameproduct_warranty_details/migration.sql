/*
  Warnings:

  - You are about to drop the `ProductWarrantyDeatils` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductWarrantyDeatils" DROP CONSTRAINT "ProductWarrantyDeatils_userId_fkey";

-- DropTable
DROP TABLE "ProductWarrantyDeatils";

-- CreateTable
CREATE TABLE "productWarrantyDetails" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceReferenceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemDesc" TEXT,
    "serialNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "productCategory" TEXT,
    "countryCode" TEXT,
    "invoiceData" JSONB NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "isExtendWarranty" BOOLEAN NOT NULL DEFAULT false,
    "extendedWarrantyMonths" INTEGER,
    "extendedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productWarrantyDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "productWarrantyDetails" ADD CONSTRAINT "productWarrantyDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

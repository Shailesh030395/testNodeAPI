/*
  Warnings:

  - A unique constraint covering the columns `[companyId,serialNumber]` on the table `productWarrantyDetails` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "productWarrantyDetails_companyId_serialNumber_key" ON "productWarrantyDetails"("companyId", "serialNumber");

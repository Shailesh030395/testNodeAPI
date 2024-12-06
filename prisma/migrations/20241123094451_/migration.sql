/*
  Warnings:

  - A unique constraint covering the columns `[companyId,serialNumber,itemName,customerName]` on the table `productWarrantyDetails` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "productWarrantyDetails_companyId_serialNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "productWarrantyDetails_companyId_serialNumber_itemName_cust_key" ON "productWarrantyDetails"("companyId", "serialNumber", "itemName", "customerName");

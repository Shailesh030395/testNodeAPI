/*
  Warnings:

  - You are about to drop the column `userId` on the `productWarrantyDetails` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "productWarrantyDetails" DROP CONSTRAINT "productWarrantyDetails_userId_fkey";

-- AlterTable
ALTER TABLE "productWarrantyDetails" DROP COLUMN "userId";

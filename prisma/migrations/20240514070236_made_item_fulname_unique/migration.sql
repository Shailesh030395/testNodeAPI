/*
  Warnings:

  - A unique constraint covering the columns `[fullName]` on the table `ItemInventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inventorySiteDetails` to the `ItemInventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ItemInventory" ADD COLUMN     "inventorySiteDetails" JSONB NOT NULL,
ALTER COLUMN "timeCreated" SET DATA TYPE TEXT,
ALTER COLUMN "timeModified" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ItemInventory_fullName_key" ON "ItemInventory"("fullName");

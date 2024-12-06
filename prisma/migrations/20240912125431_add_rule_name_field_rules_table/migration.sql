/*
  Warnings:

  - Added the required column `ruleName` to the `Rule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Rule" ADD COLUMN     "ruleName" TEXT NOT NULL;

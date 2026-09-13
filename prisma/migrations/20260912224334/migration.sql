/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profile" DROP COLUMN "phoneNumber",
ADD COLUMN     "contactNumber" TEXT;

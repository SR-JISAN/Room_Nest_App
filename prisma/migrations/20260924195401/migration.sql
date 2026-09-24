/*
  Warnings:

  - You are about to drop the column `rentAmount` on the `subRoomBooking` table. All the data in the column will be lost.
  - You are about to drop the column `securityDeposit` on the `subRoomBooking` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `subRoomBooking` table. All the data in the column will be lost.
  - Added the required column `subRentAmount` to the `subRoomBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subRoomBooking" DROP COLUMN "rentAmount",
DROP COLUMN "securityDeposit",
DROP COLUMN "totalAmount",
ADD COLUMN     "subRentAmount" DECIMAL(10,2) NOT NULL;

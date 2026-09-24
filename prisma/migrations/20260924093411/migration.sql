/*
  Warnings:

  - The `refundAt` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `subBookingId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SubBookingStatus" AS ENUM ('ACCEPTED', 'PENDING', 'REJECTED', 'CANCELLED');

-- DropIndex
DROP INDEX "payments_bookingId_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "subBookingId" TEXT NOT NULL,
DROP COLUMN "refundAt",
ADD COLUMN     "refundAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "subBooking" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" SMALLINT NOT NULL,
    "gender" "Gender" NOT NULL,
    "imageURL" TEXT DEFAULT '',
    "imagePublicId" TEXT DEFAULT '',
    "status" "SubBookingStatus" NOT NULL DEFAULT 'PENDING',
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "occupantCount" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "rentAmount" DECIMAL(10,2) NOT NULL,
    "securityDeposit" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subBooking_name_idx" ON "subBooking"("name");

-- CreateIndex
CREATE INDEX "subBooking_gender_idx" ON "subBooking"("gender");

-- CreateIndex
CREATE INDEX "subBooking_roomId_status_idx" ON "subBooking"("roomId", "status");

-- CreateIndex
CREATE INDEX "subBooking_roomId_startDate_endDate_idx" ON "subBooking"("roomId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subBookingId_fkey" FOREIGN KEY ("subBookingId") REFERENCES "subBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subBooking" ADD CONSTRAINT "subBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subBooking" ADD CONSTRAINT "subBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

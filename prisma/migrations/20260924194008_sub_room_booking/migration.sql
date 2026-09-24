/*
  Warnings:

  - You are about to drop the `subBooking` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_subBookingId_fkey";

-- DropForeignKey
ALTER TABLE "subBooking" DROP CONSTRAINT "subBooking_roomId_fkey";

-- DropForeignKey
ALTER TABLE "subBooking" DROP CONSTRAINT "subBooking_userId_fkey";

-- DropTable
DROP TABLE "subBooking";

-- CreateTable
CREATE TABLE "subRoomBooking" (
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

    CONSTRAINT "subRoomBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subRoomBooking_name_idx" ON "subRoomBooking"("name");

-- CreateIndex
CREATE INDEX "subRoomBooking_gender_idx" ON "subRoomBooking"("gender");

-- CreateIndex
CREATE INDEX "subRoomBooking_roomId_status_idx" ON "subRoomBooking"("roomId", "status");

-- CreateIndex
CREATE INDEX "subRoomBooking_roomId_startDate_endDate_idx" ON "subRoomBooking"("roomId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subBookingId_fkey" FOREIGN KEY ("subBookingId") REFERENCES "subRoomBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subRoomBooking" ADD CONSTRAINT "subRoomBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subRoomBooking" ADD CONSTRAINT "subRoomBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

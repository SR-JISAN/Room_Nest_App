/*
  Warnings:

  - You are about to drop the column `gatewayTransactionId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[merchantInvoiceNumber]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bkashPaymentID]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bkashTrxID]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[refundTrxID]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `merchantInvoiceNumber` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "payments_gatewayTransactionId_key";

-- DropIndex
DROP INDEX "payments_invoiceId_key";

-- DropIndex
DROP INDEX "payments_transactionId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "gatewayTransactionId",
DROP COLUMN "invoiceId",
DROP COLUMN "transactionId",
ADD COLUMN     "bkashPaymentID" TEXT,
ADD COLUMN     "bkashTrxID" TEXT,
ADD COLUMN     "merchantInvoiceNumber" TEXT NOT NULL,
ADD COLUMN     "payerReference" TEXT,
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "refundAt" TEXT,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundTrxID" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_merchantInvoiceNumber_key" ON "payments"("merchantInvoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bkashPaymentID_key" ON "payments"("bkashPaymentID");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bkashTrxID_key" ON "payments"("bkashTrxID");

-- CreateIndex
CREATE UNIQUE INDEX "payments_refundTrxID_key" ON "payments"("refundTrxID");

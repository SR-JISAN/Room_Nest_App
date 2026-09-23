/*
  Warnings:

  - Added the required column `paymentType` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SECURITY_DEPOSIT', 'MONTHLY_RENT');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentType" "PaymentType" NOT NULL;

/*
  Warnings:

  - You are about to drop the column `landlordId` on the `properties` table. All the data in the column will be lost.
  - Added the required column `usersId` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_landlordId_fkey";

-- DropIndex
DROP INDEX "properties_landlordId_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "landlordId",
ADD COLUMN     "usersId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

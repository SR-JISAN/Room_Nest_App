/*
  Warnings:

  - You are about to drop the column `name` on the `amenities` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[amenityName]` on the table `amenities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amenityName` to the `amenities` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "amenities_name_key";

-- AlterTable
ALTER TABLE "amenities" DROP COLUMN "name",
ADD COLUMN     "amenityName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "amenities_amenityName_key" ON "amenities"("amenityName");

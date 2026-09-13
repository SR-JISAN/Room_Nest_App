/*
  Warnings:

  - You are about to drop the column `country` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `nidNumber` on the `profile` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - Added the required column `phoneNumber` to the `profile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "profile_nidNumber_key";

-- AlterTable
ALTER TABLE "profile" DROP COLUMN "country",
DROP COLUMN "nidNumber",
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "imageURL" DROP NOT NULL,
ALTER COLUMN "imagePublicId" DROP NOT NULL;

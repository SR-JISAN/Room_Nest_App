-- DropIndex
DROP INDEX "properties_propertyStatus_idx";

-- AlterTable
ALTER TABLE "propertyImage" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "properties_propertyStatus_title_idx" ON "properties"("propertyStatus", "title");

-- CreateIndex
CREATE INDEX "properties_propertyType_idx" ON "properties"("propertyType");

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'SUBLET', 'HOSTEL', 'ROOM');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'SHEAR', 'MASTER');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'BOOKED');

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "area" VARCHAR(100) NOT NULL,
    "latitude" TEXT NOT NULL,
    "longitude" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "propertyStatus" "PropertyStatus" NOT NULL DEFAULT 'PENDING',
    "landlordId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propertyAmenities" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "propertyAmenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propertyImage" (
    "id" TEXT NOT NULL,
    "propertyImageURL" TEXT DEFAULT '',
    "propertyImagePublicId" TEXT DEFAULT '',
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roomAmenities" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roomAmenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roomImage" (
    "id" TEXT NOT NULL,
    "roomImageURL" TEXT DEFAULT '',
    "roomImagePublicId" TEXT DEFAULT '',
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roomImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "rentAmount" DECIMAL(10,2) NOT NULL,
    "securityDeposit" DECIMAL(10,2) NOT NULL,
    "roomStatus" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE INDEX "properties_propertyStatus_idx" ON "properties"("propertyStatus");

-- CreateIndex
CREATE INDEX "properties_landlordId_idx" ON "properties"("landlordId");

-- CreateIndex
CREATE INDEX "properties_city_idx" ON "properties"("city");

-- CreateIndex
CREATE INDEX "properties_area_idx" ON "properties"("area");

-- CreateIndex
CREATE INDEX "propertyAmenities_propertyId_idx" ON "propertyAmenities"("propertyId");

-- CreateIndex
CREATE INDEX "propertyAmenities_amenityId_idx" ON "propertyAmenities"("amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "propertyAmenities_propertyId_amenityId_key" ON "propertyAmenities"("propertyId", "amenityId");

-- CreateIndex
CREATE INDEX "propertyImage_propertyId_idx" ON "propertyImage"("propertyId");

-- CreateIndex
CREATE INDEX "roomAmenities_roomId_idx" ON "roomAmenities"("roomId");

-- CreateIndex
CREATE INDEX "roomAmenities_amenityId_idx" ON "roomAmenities"("amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "roomAmenities_roomId_amenityId_key" ON "roomAmenities"("roomId", "amenityId");

-- CreateIndex
CREATE INDEX "roomImage_roomId_idx" ON "roomImage"("roomId");

-- CreateIndex
CREATE INDEX "rooms_propertyId_idx" ON "rooms"("propertyId");

-- CreateIndex
CREATE INDEX "rooms_roomType_rentAmount_roomStatus_idx" ON "rooms"("roomType", "rentAmount", "roomStatus");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propertyAmenities" ADD CONSTRAINT "propertyAmenities_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propertyAmenities" ADD CONSTRAINT "propertyAmenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propertyImage" ADD CONSTRAINT "propertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roomAmenities" ADD CONSTRAINT "roomAmenities_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roomAmenities" ADD CONSTRAINT "roomAmenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roomImage" ADD CONSTRAINT "roomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

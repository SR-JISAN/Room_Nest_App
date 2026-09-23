-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "currentRoommates" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxRoommates" INTEGER NOT NULL DEFAULT 1;

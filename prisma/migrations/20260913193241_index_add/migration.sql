-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "profile_id_userId_idx" ON "profile"("id", "userId");

-- CreateIndex
CREATE INDEX "users_id_email_role_idx" ON "users"("id", "email", "role");

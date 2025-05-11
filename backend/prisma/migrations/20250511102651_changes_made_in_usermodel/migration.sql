-- AlterTable
ALTER TABLE "User" ALTER COLUMN "forgotPasswordToken" DROP NOT NULL,
ALTER COLUMN "refreshToken" DROP NOT NULL,
ALTER COLUMN "emailVerificationToken" DROP NOT NULL;

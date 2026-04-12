/*
  Warnings:

  - The values [RETURNED] on the enum `RideStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RideStatus_new" AS ENUM ('ACTIVE', 'FINISHED');
ALTER TABLE "public"."Ride" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ride" ALTER COLUMN "status" TYPE "RideStatus_new" USING ("status"::text::"RideStatus_new");
ALTER TYPE "RideStatus" RENAME TO "RideStatus_old";
ALTER TYPE "RideStatus_new" RENAME TO "RideStatus";
DROP TYPE "public"."RideStatus_old";
ALTER TABLE "Ride" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "totalCostCents" INTEGER;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "pricePerMinuteCents" INTEGER NOT NULL DEFAULT 0;

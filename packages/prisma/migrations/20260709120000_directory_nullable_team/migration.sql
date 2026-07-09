-- AlterTable: make teamId nullable (external schools without a Lanebook team)
ALTER TABLE "DirectoryListing" ALTER COLUMN "teamId" DROP NOT NULL;

-- Add new columns for enriched directory data
ALTER TABLE "DirectoryListing" ADD COLUMN "rating" DECIMAL(2,1);
ALTER TABLE "DirectoryListing" ADD COLUMN "reviewCount" INTEGER;
ALTER TABLE "DirectoryListing" ADD COLUMN "latitude" DECIMAL(10,7);
ALTER TABLE "DirectoryListing" ADD COLUMN "longitude" DECIMAL(10,7);
ALTER TABLE "DirectoryListing" ADD COLUMN "googlePlaceId" TEXT;

-- Add index on state for state-based filtering
CREATE INDEX "DirectoryListing_state_idx" ON "DirectoryListing"("state");

-- Add columns introduced in the Prisma schema but absent from deployed databases.
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "longDescription" TEXT;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "courierName" TEXT,
ADD COLUMN IF NOT EXISTS "courierTrackingLink" TEXT;

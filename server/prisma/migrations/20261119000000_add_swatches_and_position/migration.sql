-- DropIndex
DROP INDEX "CartItem_cartId_productId_variantLabel_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "swatchLabel" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "swatchLabel" TEXT,
ADD COLUMN     "swatches" JSONB;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "swatchLabel" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantLabel_swatchLabel_key" ON "CartItem"("cartId", "productId", "variantLabel", "swatchLabel");

-- CreateIndex
CREATE INDEX "Product_position_idx" ON "Product"("position");


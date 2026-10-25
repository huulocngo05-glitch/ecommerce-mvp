-- DropIndex
DROP INDEX "Order_createdAt_idx";

-- DropIndex
DROP INDEX "OrderDetail_orderId_productId_key";

-- DropIndex
DROP INDEX "Product_name_idx";

-- CreateIndex
CREATE INDEX "Shipment_oid_idx" ON "Shipment"("oid");

-- RenameForeignKey
ALTER TABLE "Order" RENAME CONSTRAINT "Order_userId_fkey" TO "Order_uid_fkey";

-- RenameForeignKey
ALTER TABLE "OrderDetail" RENAME CONSTRAINT "OrderDetail_orderId_fkey" TO "OrderDetail_oid_fkey";

-- RenameForeignKey
ALTER TABLE "OrderDetail" RENAME CONSTRAINT "OrderDetail_productId_fkey" TO "OrderDetail_pid_fkey";

-- RenameForeignKey
ALTER TABLE "Shipment" RENAME CONSTRAINT "Shipment_orderId_fkey" TO "Shipment_oid_fkey";

-- RenameForeignKey
ALTER TABLE "User" RENAME CONSTRAINT "User_roleId_fkey" TO "User_roleid_fkey";

-- RenameIndex
ALTER INDEX "Order_userId_idx" RENAME TO "Order_uid_idx";

-- RenameIndex
ALTER INDEX "OrderDetail_productId_idx" RENAME TO "OrderDetail_pid_idx";

-- RenameIndex
ALTER INDEX "Role_name_key" RENAME TO "Role_rolename_key";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "User_username_key";

-- RenameIndex
ALTER INDEX "User_roleId_idx" RENAME TO "User_roleid_idx";


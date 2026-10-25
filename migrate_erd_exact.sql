-- Chuyen PostgreSQL schema cu sang ERD 7 bang; giu khoa chinh va du lieu cot con dung.
-- Chay chi sau khi da sao luu. Tat ca nam trong transaction: loi => ROLLBACK.
\set ON_ERROR_STOP on
BEGIN;

-- Preflight: dung neu du lieu khong the chuyen an toan.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "User" WHERE length(email) > 50 OR length("fullName") > 100 OR length("passwordHash") > 255) THEN
    RAISE EXCEPTION 'User co gia tri vuot gioi han VARCHAR cua ERD';
  END IF;
  IF EXISTS (SELECT 1 FROM "Role" WHERE length(name) > 50) THEN
    RAISE EXCEPTION 'Role.name vuot 50 ky tu';
  END IF;
  IF EXISTS (SELECT 1 FROM "Product" WHERE length(name) > 100 OR abs(price) >= 100000000) THEN
    RAISE EXCEPTION 'Product.name hoac price vuot gioi han ERD';
  END IF;
  IF EXISTS (SELECT 1 FROM "OrderDetail" WHERE abs("unitPrice") >= 100000000) THEN
    RAISE EXCEPTION 'OrderDetail.unitPrice vuot gioi han ERD';
  END IF;
  IF EXISTS (SELECT 1 FROM "OrderDetail" GROUP BY "orderId", "productId" HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'OrderDetail trung (orderId, productId), khong the tao khoa chinh kep';
  END IF;
END $$;

-- 1. Role
ALTER TABLE "Role" RENAME COLUMN "id" TO "roleid";
ALTER TABLE "Role" RENAME COLUMN "name" TO "rolename";
ALTER TABLE "Role" ALTER COLUMN "rolename" TYPE VARCHAR(50);
ALTER TABLE "Role" DROP COLUMN "createdAt", DROP COLUMN "updatedAt";

-- 2. MemberShip (dung ten bang chinh xac theo hinh)
CREATE TABLE "MemberShip" (
  "mid" SERIAL PRIMARY KEY,
  "mname" VARCHAR(50) NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "MemberShip" ("mname", "score") VALUES ('DEFAULT', 0);

-- 3. User: chuyen email cu thanh username de giu dinh danh dang nhap.
-- passwordHash cu da duoc bam (hash): chi DOI TEN, khong giai ma.
ALTER TABLE "User" RENAME COLUMN "id" TO "uid";
ALTER TABLE "User" RENAME COLUMN "email" TO "username";
ALTER TABLE "User" RENAME COLUMN "fullName" TO "fullname";
ALTER TABLE "User" RENAME COLUMN "passwordHash" TO "password";
ALTER TABLE "User" RENAME COLUMN "roleId" TO "roleid";
ALTER TABLE "User" ALTER COLUMN "username" TYPE VARCHAR(50);
ALTER TABLE "User" ALTER COLUMN "fullname" TYPE VARCHAR(100);
ALTER TABLE "User" ALTER COLUMN "password" TYPE VARCHAR(255);
ALTER TABLE "User" ADD COLUMN "mid" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ALTER COLUMN "mid" DROP DEFAULT;
ALTER TABLE "User" ADD CONSTRAINT "User_mid_fkey" FOREIGN KEY ("mid") REFERENCES "MemberShip"("mid") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "User" DROP COLUMN "phone", DROP COLUMN "address", DROP COLUMN "status", DROP COLUMN "createdAt", DROP COLUMN "updatedAt";
CREATE INDEX "User_mid_idx" ON "User"("mid");

-- 4. Product
ALTER TABLE "Product" RENAME COLUMN "id" TO "pid";
ALTER TABLE "Product" RENAME COLUMN "name" TO "pname";
ALTER TABLE "Product" RENAME COLUMN "stock" TO "quantity";
ALTER TABLE "Product" ALTER COLUMN "pname" TYPE VARCHAR(100);
ALTER TABLE "Product" ALTER COLUMN "price" TYPE DECIMAL(10,2);
ALTER TABLE "Product" DROP COLUMN "description", DROP COLUMN "imageUrl", DROP COLUMN "isActive", DROP COLUMN "createdAt", DROP COLUMN "updatedAt";
ALTER TABLE "Product" ALTER COLUMN "quantity" DROP DEFAULT;

-- 5. Order
ALTER TABLE "Order" RENAME COLUMN "id" TO "oid";
ALTER TABLE "Order" RENAME COLUMN "userId" TO "uid";
ALTER TABLE "Order" RENAME COLUMN "createdAt" TO "createat";
ALTER TABLE "Order" DROP COLUMN "status", DROP COLUMN "totalAmount", DROP COLUMN "shippingAddress", DROP COLUMN "paymentStatus", DROP COLUMN "updatedAt";

-- 6. OrderDetail: chuyen PK id -> PK (oid, pid)
ALTER TABLE "OrderDetail" RENAME COLUMN "orderId" TO "oid";
ALTER TABLE "OrderDetail" RENAME COLUMN "productId" TO "pid";
ALTER TABLE "OrderDetail" RENAME COLUMN "quantity" TO "qty";
ALTER TABLE "OrderDetail" RENAME COLUMN "unitPrice" TO "unit_price";
ALTER TABLE "OrderDetail" ALTER COLUMN "unit_price" TYPE DECIMAL(10,2);
ALTER TABLE "OrderDetail" DROP CONSTRAINT "OrderDetail_pkey";
ALTER TABLE "OrderDetail" DROP COLUMN "id";
ALTER TABLE "OrderDetail" ADD CONSTRAINT "OrderDetail_pkey" PRIMARY KEY ("oid", "pid");

-- 7. Shipment: 1 Order co the co nhieu Shipment
ALTER TABLE "Shipment" RENAME COLUMN "id" TO "shipid";
ALTER TABLE "Shipment" RENAME COLUMN "orderId" TO "oid";
ALTER TABLE "Shipment" DROP COLUMN "recipientName", DROP COLUMN "recipientPhone", DROP COLUMN "shippingAddress", DROP COLUMN "trackingNumber", DROP COLUMN "carrier", DROP COLUMN "shippedAt", DROP COLUMN "deliveredAt", DROP COLUMN "createdAt", DROP COLUMN "updatedAt";
ALTER TABLE "Shipment" ADD COLUMN "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING';
DROP INDEX IF EXISTS "Shipment_orderId_key";

-- Loai enum khong con su dung.
DROP TYPE IF EXISTS "UserStatus";
DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "PaymentStatus";

COMMIT;

-- Chi doc ket qua, khong in mat khau.
SELECT 'Role' AS table_name, count(*) AS rows FROM "Role"
UNION ALL SELECT 'User', count(*) FROM "User"
UNION ALL SELECT 'MemberShip', count(*) FROM "MemberShip"
UNION ALL SELECT 'Product', count(*) FROM "Product"
UNION ALL SELECT 'Order', count(*) FROM "Order"
UNION ALL SELECT 'OrderDetail', count(*) FROM "OrderDetail"
UNION ALL SELECT 'Shipment', count(*) FROM "Shipment";

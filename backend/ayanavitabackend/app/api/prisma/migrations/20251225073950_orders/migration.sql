/*
  Warnings:

  - The values [REFUNDED] on the enum `Order_status` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updatedAt` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Course` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Order` MODIFY `status` ENUM('PENDING', 'PAID', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    MODIFY `total` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `price` INTEGER NOT NULL DEFAULT 0;

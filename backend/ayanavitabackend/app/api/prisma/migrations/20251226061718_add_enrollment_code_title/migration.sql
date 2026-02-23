/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseTitle` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Enrollment` DROP FOREIGN KEY `Enrollment_courseId_fkey`;

-- AlterTable
ALTER TABLE `Enrollment` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `orderId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `canceledAt` DATETIME(3) NULL,
    ADD COLUMN `code` VARCHAR(32) NOT NULL,
    ADD COLUMN `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
    ADD COLUMN `discount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `subtotal` INTEGER NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('PENDING', 'PAID', 'CANCELED', 'EXPIRED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `courseTitle` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE INDEX `Enrollment_userId_idx` ON `Enrollment`(`userId`);

-- CreateIndex
CREATE INDEX `Enrollment_orderId_idx` ON `Enrollment`(`orderId`);

-- CreateIndex
CREATE UNIQUE INDEX `Order_code_key` ON `Order`(`code`);

-- CreateIndex
CREATE INDEX `Order_status_idx` ON `Order`(`status`);

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

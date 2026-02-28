-- CreateTable
CREATE TABLE `ProductOrder` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'PROCESSING', 'PAID', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `paymentMethod` ENUM('COD', 'SEPAY') NOT NULL DEFAULT 'COD',
    `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'NOT_REQUIRED', 'EXPIRED') NOT NULL DEFAULT 'NOT_REQUIRED',
    `paymentCode` VARCHAR(64) NULL,
    `receiverName` VARCHAR(255) NOT NULL,
    `receiverPhone` VARCHAR(30) NOT NULL,
    `receiverEmail` VARCHAR(255) NULL,
    `shippingAddress` VARCHAR(500) NOT NULL,
    `district` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `note` TEXT NULL,
    `shippingUnit` VARCHAR(120) NOT NULL DEFAULT '-',
    `trackingCode` VARCHAR(120) NOT NULL DEFAULT '-',
    `expectedDelivery` VARCHAR(120) NOT NULL DEFAULT '-',
    `subtotal` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `shippingFee` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
    `paidAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductOrder_code_key`(`code`),
    UNIQUE INDEX `ProductOrder_paymentCode_key`(`paymentCode`),
    INDEX `ProductOrder_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `ProductOrder_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductOrderDetail` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `orderId` BIGINT NOT NULL,
    `productId` BIGINT NOT NULL,
    `productName` VARCHAR(255) NOT NULL,
    `productSku` VARCHAR(64) NOT NULL,
    `unitPrice` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `lineTotal` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductOrderDetail_orderId_productId_key`(`orderId`, `productId`),
    INDEX `ProductOrderDetail_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductOrderPayment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `orderId` BIGINT NOT NULL,
    `provider` VARCHAR(32) NOT NULL DEFAULT 'SEPAY',
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'NOT_REQUIRED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `transferCode` VARCHAR(64) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `expiredAt` DATETIME(3) NULL,
    `rawResponse` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductOrderPayment_orderId_status_idx`(`orderId`, `status`),
    INDEX `ProductOrderPayment_transferCode_idx`(`transferCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductOrder` ADD CONSTRAINT `ProductOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductOrderDetail` ADD CONSTRAINT `ProductOrderDetail_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `ProductOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductOrderDetail` ADD CONSTRAINT `ProductOrderDetail_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductOrderPayment` ADD CONSTRAINT `ProductOrderPayment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `ProductOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
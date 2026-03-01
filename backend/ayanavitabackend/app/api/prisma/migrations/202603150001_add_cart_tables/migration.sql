    -- CreateTable
    CREATE TABLE `Cart` (
        `id` INTEGER NOT NULL AUTO_INCREMENT,
        `userId` INTEGER NOT NULL,
        `status` ENUM('ACTIVE', 'ORDERED') NOT NULL DEFAULT 'ACTIVE',
        `currency` VARCHAR(3) NOT NULL DEFAULT 'VND',
        `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        `updatedAt` DATETIME(3) NOT NULL,

        INDEX `Cart_userId_idx`(`userId`),
        INDEX `Cart_status_idx`(`status`),
        PRIMARY KEY (`id`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- CreateTable
    CREATE TABLE `CartDetail` (
        `id` INTEGER NOT NULL AUTO_INCREMENT,
        `cartId` INTEGER NOT NULL,
        `productId` BIGINT NOT NULL,
        `variantId` VARCHAR(100) NULL,
        `nameSnapshot` VARCHAR(255) NOT NULL,
        `priceSnapshot` INTEGER NOT NULL DEFAULT 0,
        `quantity` INTEGER NOT NULL DEFAULT 1,
        `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        `updatedAt` DATETIME(3) NOT NULL,

        INDEX `CartDetail_productId_idx`(`productId`),
        UNIQUE INDEX `CartDetail_cartId_productId_key`(`cartId`, `productId`),
        PRIMARY KEY (`id`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- AddForeignKey
    ALTER TABLE `Cart` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE `CartDetail` ADD CONSTRAINT `CartDetail_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE `CartDetail` ADD CONSTRAINT `CartDetail_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

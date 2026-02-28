-- Unified reviews for product/service, with moderation and image gallery
CREATE TABLE `Review` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `type` ENUM('SERVICE', 'PRODUCT') NOT NULL,
  `visibility` ENUM('VISIBLE', 'HIDDEN', 'DELETED') NOT NULL DEFAULT 'VISIBLE',
  `branchId` INTEGER NOT NULL,
  `serviceId` INTEGER NULL,
  `productId` BIGINT NULL,
  `productOrderId` BIGINT NULL,
  `productOrderDetailId` BIGINT NULL,
  `userId` INTEGER NULL,
  `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
  `customerName` VARCHAR(255) NULL,
  `stars` INTEGER NOT NULL,
  `comment` TEXT NOT NULL,
  `ipAddress` VARCHAR(64) NULL,
  `userAgent` VARCHAR(512) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `Review_type_visibility_createdAt_idx`(`type`, `visibility`, `createdAt`),
  INDEX `Review_branchId_createdAt_idx`(`branchId`, `createdAt`),
  INDEX `Review_serviceId_idx`(`serviceId`),
  INDEX `Review_productId_idx`(`productId`),
  INDEX `Review_userId_idx`(`userId`),
  INDEX `Review_ipAddress_createdAt_idx`(`ipAddress`, `createdAt`),
  UNIQUE INDEX `uniq_product_review_per_user_order_product`(`userId`, `productOrderId`, `productId`),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReviewImage` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `reviewId` BIGINT NOT NULL,
  `fileName` VARCHAR(255) NULL,
  `imageUrl` VARCHAR(500) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ReviewImage_reviewId_idx`(`reviewId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Review`
  ADD CONSTRAINT `Review_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `Review_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Review_productOrderId_fkey` FOREIGN KEY (`productOrderId`) REFERENCES `ProductOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Review_productOrderDetailId_fkey` FOREIGN KEY (`productOrderDetailId`) REFERENCES `ProductOrderDetail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ReviewImage`
  ADD CONSTRAINT `ReviewImage_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `Review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

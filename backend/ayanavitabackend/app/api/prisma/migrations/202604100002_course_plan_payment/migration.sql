CREATE TABLE `CoursePlanPayment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `planId` INT NOT NULL,
  `provider` VARCHAR(32) NOT NULL DEFAULT 'SEPAY',
  `status` ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `amount` INT NOT NULL,
  `transferCode` VARCHAR(64) NOT NULL,
  `transferContent` VARCHAR(128) NOT NULL,
  `paidAt` DATETIME(3) NULL,
  `expiredAt` DATETIME(3) NULL,
  `rawResponse` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CoursePlanPayment_transferContent_key`(`transferContent`),
  INDEX `CoursePlanPayment_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `CoursePlanPayment_planId_createdAt_idx`(`planId`, `createdAt`),
  INDEX `CoursePlanPayment_status_expiredAt_idx`(`status`, `expiredAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CoursePlanPayment`
  ADD CONSTRAINT `CoursePlanPayment_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `CoursePlanPayment_planId_fkey`
  FOREIGN KEY (`planId`) REFERENCES `CoursePlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

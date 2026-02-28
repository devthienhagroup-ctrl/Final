CREATE TABLE `ReviewHelpful` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `reviewId` BIGINT NOT NULL,
  `userId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `uniq_review_helpful_user`(`reviewId`, `userId`),
  INDEX `ReviewHelpful_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `ReviewHelpful_reviewId_idx`(`reviewId`),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ReviewHelpful`
  ADD CONSTRAINT `ReviewHelpful_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `Review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ReviewHelpful_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

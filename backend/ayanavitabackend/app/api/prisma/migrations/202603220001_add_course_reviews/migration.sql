CREATE TABLE `CourseReview` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `courseId` INTEGER NOT NULL,
  `userId` INTEGER NULL,
  `stars` INTEGER NOT NULL,
  `comment` TEXT NULL,
  `customerName` VARCHAR(255) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `CourseReview_courseId_idx`(`courseId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CourseReview`
  ADD CONSTRAINT `CourseReview_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CourseReview`
  ADD CONSTRAINT `CourseReview_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

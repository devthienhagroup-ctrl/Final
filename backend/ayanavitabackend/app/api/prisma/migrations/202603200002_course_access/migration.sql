CREATE TABLE `CourseAccess` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `courseId` INT NOT NULL,
  `status` ENUM('ACTIVE', 'CANCELED') NOT NULL DEFAULT 'ACTIVE',
  `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CourseAccess_userId_courseId_key`(`userId`, `courseId`),
  INDEX `CourseAccess_courseId_idx`(`courseId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CourseAccess`
  ADD CONSTRAINT `CourseAccess_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `CourseAccess_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

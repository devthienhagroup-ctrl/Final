ALTER TABLE `Course`
  ADD COLUMN `shortDescription` VARCHAR(500) NULL AFTER `title`;

CREATE TABLE `CourseTranslation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `courseId` INTEGER NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `shortDescription` VARCHAR(500) NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `CourseTranslation_courseId_locale_key`(`courseId`, `locale`),
  INDEX `CourseTranslation_locale_idx`(`locale`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CourseTranslation`
  ADD CONSTRAINT `CourseTranslation_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

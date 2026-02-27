ALTER TABLE `Course`
  DROP COLUMN `titleI18n`,
  DROP COLUMN `descriptionI18n`,
  DROP COLUMN `shortDescriptionI18n`;

ALTER TABLE `Lesson`
  DROP COLUMN `titleI18n`,
  DROP COLUMN `descriptionI18n`;

ALTER TABLE `LessonModule`
  DROP COLUMN `titleI18n`,
  DROP COLUMN `descriptionI18n`;

ALTER TABLE `LessonVideo`
  DROP COLUMN `titleI18n`,
  DROP COLUMN `descriptionI18n`,
  ADD COLUMN `mediaType` ENUM('VIDEO','IMAGE') NOT NULL DEFAULT 'VIDEO';

CREATE TABLE `CourseContentTranslation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `courseId` INTEGER NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `objectives` JSON NULL,
  `targetAudience` JSON NULL,
  `benefits` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CourseContentTranslation_courseId_locale_key`(`courseId`, `locale`),
  INDEX `CourseContentTranslation_locale_idx`(`locale`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LessonTranslation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `lessonId` INTEGER NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LessonTranslation_lessonId_locale_key`(`lessonId`, `locale`),
  INDEX `LessonTranslation_locale_idx`(`locale`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LessonModuleTranslation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `moduleId` INTEGER NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LessonModuleTranslation_moduleId_locale_key`(`moduleId`, `locale`),
  INDEX `LessonModuleTranslation_locale_idx`(`locale`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LessonVideoTranslation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `videoId` INTEGER NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LessonVideoTranslation_videoId_locale_key`(`videoId`, `locale`),
  INDEX `LessonVideoTranslation_locale_idx`(`locale`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CourseContentTranslation`
  ADD CONSTRAINT `CourseContentTranslation_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LessonTranslation`
  ADD CONSTRAINT `LessonTranslation_lessonId_fkey`
  FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LessonModuleTranslation`
  ADD CONSTRAINT `LessonModuleTranslation_moduleId_fkey`
  FOREIGN KEY (`moduleId`) REFERENCES `LessonModule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LessonVideoTranslation`
  ADD CONSTRAINT `LessonVideoTranslation_videoId_fkey`
  FOREIGN KEY (`videoId`) REFERENCES `LessonVideo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

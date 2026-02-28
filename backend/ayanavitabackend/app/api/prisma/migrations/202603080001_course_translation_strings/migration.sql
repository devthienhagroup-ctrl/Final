SET @course_short_description_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Course'
    AND COLUMN_NAME = 'shortDescription'
);

SET @course_short_description_column_sql := IF(
  @course_short_description_column_exists = 0,
  'ALTER TABLE `Course` ADD COLUMN `shortDescription` VARCHAR(500) NULL AFTER `title`',
  'SELECT 1'
);

PREPARE course_short_description_column_stmt FROM @course_short_description_column_sql;
EXECUTE course_short_description_column_stmt;
DEALLOCATE PREPARE course_short_description_column_stmt;

CREATE TABLE IF NOT EXISTS `CourseTranslation` (
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

SET @course_translation_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'CourseTranslation'
    AND CONSTRAINT_NAME = 'CourseTranslation_courseId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @course_translation_fk_sql := IF(
  @course_translation_fk_exists = 0,
  'ALTER TABLE `CourseTranslation` ADD CONSTRAINT `CourseTranslation_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE course_translation_fk_stmt FROM @course_translation_fk_sql;
EXECUTE course_translation_fk_stmt;
DEALLOCATE PREPARE course_translation_fk_stmt;

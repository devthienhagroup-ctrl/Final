-- Make migration resilient across MySQL variants (including versions
-- that do not support IF EXISTS/IF NOT EXISTS in DDL directly).
-- We use information_schema checks + dynamic SQL.

-- =========================
-- Drop legacy indexes first
-- =========================
SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'Lesson'
      AND index_name = 'Lesson_courseId_order_idx'
  ),
  'DROP INDEX `Lesson_courseId_order_idx` ON `Lesson`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonModule'
      AND index_name = 'LessonModule_lessonId_order_idx'
  ),
  'DROP INDEX `LessonModule_lessonId_order_idx` ON `LessonModule`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonVideo'
      AND index_name = 'LessonVideo_moduleId_order_idx'
  ),
  'DROP INDEX `LessonVideo_moduleId_order_idx` ON `LessonVideo`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =========================
-- Lesson table
-- =========================
SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'Lesson'
      AND column_name = 'videoUrl'
  ),
  'ALTER TABLE `Lesson` DROP COLUMN `videoUrl`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'Lesson'
      AND column_name = 'order'
  ),
  'ALTER TABLE `Lesson` DROP COLUMN `order`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'Lesson'
      AND column_name = 'published'
  ),
  'ALTER TABLE `Lesson` DROP COLUMN `published`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'Lesson'
      AND column_name = 'stt'
  ),
  'SELECT 1',
  'ALTER TABLE `Lesson` ADD COLUMN `stt` INT NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =========================
-- LessonModule table
-- =========================
SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonModule'
      AND column_name = 'order'
  ),
  'ALTER TABLE `LessonModule` DROP COLUMN `order`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonModule'
      AND column_name = 'published'
  ),
  'ALTER TABLE `LessonModule` DROP COLUMN `published`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonModule'
      AND column_name = 'stt'
  ),
  'SELECT 1',
  'ALTER TABLE `LessonModule` ADD COLUMN `stt` INT NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =========================
-- LessonVideo table
-- =========================
SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonVideo'
      AND column_name = 'order'
  ),
  'ALTER TABLE `LessonVideo` DROP COLUMN `order`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonVideo'
      AND column_name = 'stt'
  ),
  'SELECT 1',
  'ALTER TABLE `LessonVideo` ADD COLUMN `stt` INT NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =========================
-- Recreate STT indexes
-- =========================
SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'Lesson'
      AND index_name = 'Lesson_courseId_stt_idx'
  ),
  'DROP INDEX `Lesson_courseId_stt_idx` ON `Lesson`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonModule'
      AND index_name = 'LessonModule_lessonId_stt_idx'
  ),
  'DROP INDEX `LessonModule_lessonId_stt_idx` ON `LessonModule`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'LessonVideo'
      AND index_name = 'LessonVideo_moduleId_stt_idx'
  ),
  'DROP INDEX `LessonVideo_moduleId_stt_idx` ON `LessonVideo`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE INDEX `Lesson_courseId_stt_idx` ON `Lesson`(`courseId`, `stt`);
CREATE INDEX `LessonModule_lessonId_stt_idx` ON `LessonModule`(`lessonId`, `stt`);
CREATE INDEX `LessonVideo_moduleId_stt_idx` ON `LessonVideo`(`moduleId`, `stt`);

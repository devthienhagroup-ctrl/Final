UPDATE `LessonVideo`
SET `sourceUrl` = ''
WHERE `sourceUrl` IS NULL;

ALTER TABLE `LessonVideo`
  MODIFY `sourceUrl` VARCHAR(191) NOT NULL;

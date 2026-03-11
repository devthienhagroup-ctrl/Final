ALTER TABLE `UserCoursePass`
    MODIFY COLUMN `status` ENUM('SCHEDULED', 'ACTIVE', 'GRACE', 'EXPIRED', 'CANCELED') NOT NULL;

UPDATE `UserCoursePass`
SET `status` = 'SCHEDULED'
WHERE `canceledAt` IS NULL
  AND `startAt` > NOW()
  AND `status` = 'EXPIRED';
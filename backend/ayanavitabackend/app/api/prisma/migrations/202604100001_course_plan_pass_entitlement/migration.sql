CREATE TABLE `CourseTag` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CourseTag_code_key`(`code`),
  INDEX `CourseTag_name_idx`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CourseTagLink` (
  `courseId` INT NOT NULL,
  `tagId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `CourseTagLink_tagId_idx`(`tagId`),
  PRIMARY KEY (`courseId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CoursePlan` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `price` INT NOT NULL DEFAULT 0,
  `durationDays` INT NOT NULL DEFAULT 30,
  `graceDays` INT NOT NULL DEFAULT 14,
  `maxUnlocks` INT NOT NULL DEFAULT 50,
  `maxCoursePrice` INT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CoursePlan_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CoursePlanExcludedTag` (
  `planId` INT NOT NULL,
  `tagId` INT NOT NULL,
  INDEX `CoursePlanExcludedTag_tagId_idx`(`tagId`),
  PRIMARY KEY (`planId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserCoursePass` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `planId` INT NOT NULL,
  `purchaseId` INT NULL,
  `startAt` DATETIME(3) NOT NULL,
  `endAt` DATETIME(3) NOT NULL,
  `graceUntil` DATETIME(3) NOT NULL,
  `remainingUnlocks` INT NOT NULL,
  `status` ENUM('ACTIVE', 'GRACE', 'EXPIRED', 'CANCELED') NOT NULL DEFAULT 'ACTIVE',
  `canceledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `UserCoursePass_userId_graceUntil_idx`(`userId`, `graceUntil`),
  INDEX `UserCoursePass_userId_endAt_idx`(`userId`, `endAt`),
  INDEX `UserCoursePass_userId_status_idx`(`userId`, `status`),
  INDEX `UserCoursePass_planId_idx`(`planId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CourseEntitlement` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `courseId` INT NOT NULL,
  `sourceType` ENUM('SINGLE_PURCHASE', 'PLAN_PASS', 'ADMIN_GRANT') NOT NULL,
  `sourceId` INT NULL,
  `accessStartAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `accessEndAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CourseEntitlement_userId_courseId_sourceType_sourceId_key`(`userId`, `courseId`, `sourceType`, `sourceId`),
  INDEX `CourseEntitlement_userId_courseId_idx`(`userId`, `courseId`),
  INDEX `CourseEntitlement_userId_accessEndAt_idx`(`userId`, `accessEndAt`),
  INDEX `CourseEntitlement_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PlanUnlockLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `passId` INT NOT NULL,
  `userId` INT NOT NULL,
  `courseId` INT NOT NULL,
  `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `PlanUnlockLog_passId_courseId_key`(`passId`, `courseId`),
  INDEX `PlanUnlockLog_userId_unlockedAt_idx`(`userId`, `unlockedAt`),
  INDEX `PlanUnlockLog_courseId_idx`(`courseId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CourseTagLink`
  ADD CONSTRAINT `CourseTagLink_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `CourseTagLink_tagId_fkey`
  FOREIGN KEY (`tagId`) REFERENCES `CourseTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CoursePlanExcludedTag`
  ADD CONSTRAINT `CoursePlanExcludedTag_planId_fkey`
  FOREIGN KEY (`planId`) REFERENCES `CoursePlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `CoursePlanExcludedTag_tagId_fkey`
  FOREIGN KEY (`tagId`) REFERENCES `CourseTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserCoursePass`
  ADD CONSTRAINT `UserCoursePass_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserCoursePass_planId_fkey`
  FOREIGN KEY (`planId`) REFERENCES `CoursePlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CourseEntitlement`
  ADD CONSTRAINT `CourseEntitlement_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `CourseEntitlement_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PlanUnlockLog`
  ADD CONSTRAINT `PlanUnlockLog_passId_fkey`
  FOREIGN KEY (`passId`) REFERENCES `UserCoursePass`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PlanUnlockLog_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PlanUnlockLog_courseId_fkey`
  FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

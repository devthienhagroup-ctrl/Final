CREATE TABLE `LessonVideoProgress` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `lessonId` INT NOT NULL,
  `moduleId` INT NOT NULL,
  `videoId` INT NOT NULL,
  `watchedSec` INT NOT NULL DEFAULT 0,
  `completed` BOOLEAN NOT NULL DEFAULT false,
  `completedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LessonVideoProgress_userId_videoId_key`(`userId`, `videoId`),
  INDEX `LessonVideoProgress_userId_lessonId_idx`(`userId`, `lessonId`),
  INDEX `LessonVideoProgress_userId_moduleId_idx`(`userId`, `moduleId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `LessonVideoProgress`
  ADD CONSTRAINT `LessonVideoProgress_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `LessonVideoProgress_lessonId_fkey`
  FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `LessonVideoProgress_moduleId_fkey`
  FOREIGN KEY (`moduleId`) REFERENCES `LessonModule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `LessonVideoProgress_videoId_fkey`
  FOREIGN KEY (`videoId`) REFERENCES `LessonVideo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

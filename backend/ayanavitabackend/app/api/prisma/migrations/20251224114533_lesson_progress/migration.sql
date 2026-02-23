-- AlterTable
ALTER TABLE `LessonProgress` ADD COLUMN `lastOpenedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `lastPositionSec` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `LessonProgress_userId_idx` ON `LessonProgress`(`userId`);

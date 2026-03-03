ALTER TABLE `Course`
  ADD COLUMN `creatorId` INTEGER NULL;

CREATE INDEX `Course_creatorId_idx` ON `Course`(`creatorId`);

ALTER TABLE `Course`
  ADD CONSTRAINT `Course_creatorId_fkey`
  FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

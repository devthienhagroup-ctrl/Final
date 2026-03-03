CREATE TABLE `UserManagementLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `action` VARCHAR(64) NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `actorUserId` INT NULL,
  `targetUserId` INT NOT NULL,
  `oldEmail` VARCHAR(255) NULL,
  `newEmail` VARCHAR(255) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `UserManagementLog_targetUserId_idx`(`targetUserId`),
  INDEX `UserManagementLog_actorUserId_idx`(`actorUserId`),
  INDEX `UserManagementLog_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserManagementLog`
  ADD CONSTRAINT `UserManagementLog_actorUserId_fkey`
  FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `UserManagementLog`
  ADD CONSTRAINT `UserManagementLog_targetUserId_fkey`
  FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

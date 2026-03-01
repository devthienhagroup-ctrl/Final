CREATE TABLE `RoleAuditLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `action` VARCHAR(80) NOT NULL,
  `message` VARCHAR(255) NOT NULL,
  `actorUserId` INT NULL,
  `targetUserId` INT NULL,
  `roleId` INT NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `RoleAuditLog_createdAt_idx`(`createdAt`),
  INDEX `RoleAuditLog_actorUserId_idx`(`actorUserId`),
  INDEX `RoleAuditLog_targetUserId_idx`(`targetUserId`),
  INDEX `RoleAuditLog_roleId_idx`(`roleId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RoleAuditLog`
  ADD CONSTRAINT `RoleAuditLog_actorUserId_fkey`
    FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `RoleAuditLog_targetUserId_fkey`
    FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `RoleAuditLog_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

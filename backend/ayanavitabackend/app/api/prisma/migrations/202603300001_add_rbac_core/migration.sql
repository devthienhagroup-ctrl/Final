-- RBAC core tables + User.roleId relation

CREATE TABLE `Role` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `scopeType` ENUM('OWN', 'BRANCH', 'COURSE', 'GLOBAL') NOT NULL,
  `description` VARCHAR(255) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Role_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Permission` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(120) NOT NULL,
  `resource` VARCHAR(80) NOT NULL,
  `action` VARCHAR(80) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Permission_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RolePermission` (
  `roleId` INT NOT NULL,
  `permissionId` INT NOT NULL,
  INDEX `RolePermission_permissionId_idx`(`permissionId`),
  PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `User`
  ADD COLUMN `roleId` INT NULL,
  ADD INDEX `User_roleId_idx`(`roleId`);

ALTER TABLE `RolePermission`
  ADD CONSTRAINT `RolePermission_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `RolePermission_permissionId_fkey`
  FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `User`
  ADD CONSTRAINT `User_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

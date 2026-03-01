-- CreateTable
CREATE TABLE `BlogPost` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `authorId` INTEGER NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `summary` VARCHAR(500) NULL,
  `content` LONGTEXT NOT NULL,
  `coverImage` VARCHAR(500) NULL,
  `tags` JSON NULL,
  `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  `publishedAt` DATETIME(3) NULL,
  `views` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `BlogPost_slug_key`(`slug`),
  INDEX `BlogPost_status_publishedAt_idx`(`status`, `publishedAt`),
  INDEX `BlogPost_authorId_createdAt_idx`(`authorId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogViewTracker` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `blogId` INTEGER NOT NULL,
  `ipAddress` VARCHAR(64) NOT NULL,
  `lastViewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastCountedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `uniq_blog_ip`(`blogId`, `ipAddress`),
  INDEX `BlogViewTracker_lastViewedAt_idx`(`lastViewedAt`),
  INDEX `BlogViewTracker_lastCountedAt_idx`(`lastCountedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogSavedPost` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `blogId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `uniq_saved_blog`(`userId`, `blogId`),
  INDEX `BlogSavedPost_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BlogPost` ADD CONSTRAINT `BlogPost_authorId_fkey`
FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogViewTracker` ADD CONSTRAINT `BlogViewTracker_blogId_fkey`
FOREIGN KEY (`blogId`) REFERENCES `BlogPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogSavedPost` ADD CONSTRAINT `BlogSavedPost_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlogSavedPost` ADD CONSTRAINT `BlogSavedPost_blogId_fkey`
FOREIGN KEY (`blogId`) REFERENCES `BlogPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

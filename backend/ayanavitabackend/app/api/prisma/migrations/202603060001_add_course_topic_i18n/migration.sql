-- CreateTable
CREATE TABLE `CourseTopicTranslation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `topicId` INTEGER NOT NULL,
    `locale` VARCHAR(10) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseTopicTranslation_locale_idx`(`locale`),
    UNIQUE INDEX `CourseTopicTranslation_topicId_locale_key`(`topicId`, `locale`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CourseTopicTranslation` ADD CONSTRAINT `CourseTopicTranslation_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `CourseTopic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

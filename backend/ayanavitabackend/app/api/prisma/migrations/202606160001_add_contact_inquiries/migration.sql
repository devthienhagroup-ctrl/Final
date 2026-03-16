CREATE TABLE `contact_inquiries` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(120) NULL,
  `need` VARCHAR(200) NULL,
  `note` TEXT NULL,
  `ip_address` VARCHAR(64) NOT NULL,
  `user_agent` VARCHAR(500) NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'new',
  `replied_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `idx_contact_inquiry_created`(`created_at`),
  INDEX `idx_contact_inquiry_status_created`(`status`, `created_at`),
  INDEX `idx_contact_inquiry_ip_created`(`ip_address`, `created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `contact_inquiry_replies` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `inquiry_id` INTEGER NOT NULL,
  `user_id` INTEGER NULL,
  `staff_name` VARCHAR(120) NULL,
  `staff_email` VARCHAR(120) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `idx_contact_reply_inquiry_created`(`inquiry_id`, `created_at`),
  INDEX `idx_contact_reply_user`(`user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `contact_inquiry_replies`
  ADD CONSTRAINT `contact_inquiry_replies_inquiry_id_fkey`
  FOREIGN KEY (`inquiry_id`) REFERENCES `contact_inquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `contact_inquiry_replies_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- QR scan system tables

CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Customer_email_idx`(`email`),
  INDEX `Customer_phone_idx`(`phone`),
  PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_sessions` (
  `session_id` BIGINT NOT NULL AUTO_INCREMENT,
  `customer_id` BIGINT NOT NULL,
  `device` VARCHAR(255) NULL,
  `ip` VARCHAR(50) NULL,
  `source` VARCHAR(100) NULL,
  `start_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `end_time` DATETIME(3) NULL,
  INDEX `CustomerSession_customer_id_idx`(`customer_id`),
  PRIMARY KEY (`session_id`),
  CONSTRAINT `CustomerSession_customer_id_fkey`
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scan_records` (
  `scan_id` BIGINT NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT NOT NULL,
  `qr_type` VARCHAR(100) NULL,
  `qr_id` VARCHAR(255) NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `location` VARCHAR(255) NULL,
  INDEX `ScanRecord_session_id_idx`(`session_id`),
  UNIQUE INDEX `ScanRecord_session_id_timestamp_key`(`session_id`, `timestamp`),
  PRIMARY KEY (`scan_id`),
  CONSTRAINT `ScanRecord_session_id_fkey`
    FOREIGN KEY (`session_id`) REFERENCES `customer_sessions`(`session_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profile_records` (
  `profile_id` BIGINT NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT NOT NULL,
  `customer_id` BIGINT NOT NULL,
  `profile_data` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ProfileRecord_session_id_idx`(`session_id`),
  INDEX `ProfileRecord_customer_id_idx`(`customer_id`),
  PRIMARY KEY (`profile_id`),
  CONSTRAINT `ProfileRecord_session_id_fkey`
    FOREIGN KEY (`session_id`) REFERENCES `customer_sessions`(`session_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProfileRecord_customer_id_fkey`
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `summary_records` (
  `summary_id` BIGINT NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT NOT NULL,
  `customer_id` BIGINT NOT NULL,
  `summary_data` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `SummaryRecord_session_id_idx`(`session_id`),
  INDEX `SummaryRecord_customer_id_idx`(`customer_id`),
  PRIMARY KEY (`summary_id`),
  CONSTRAINT `SummaryRecord_session_id_fkey`
    FOREIGN KEY (`session_id`) REFERENCES `customer_sessions`(`session_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SummaryRecord_customer_id_fkey`
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

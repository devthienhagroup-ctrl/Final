-- Languages
CREATE TABLE `languages` (
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `languages` (`code`, `name`, `is_active`) VALUES
  ('vi', 'Tiếng Việt', TRUE),
  ('en', 'English', TRUE),
  ('de', 'Deutsch', TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `is_active` = VALUES(`is_active`);

-- Categories + translations
CREATE TABLE `categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `category_translations` (
  `category_id` BIGINT NOT NULL,
  `language_code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  PRIMARY KEY (`category_id`, `language_code`),
  CONSTRAINT `fk_ct_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ct_language` FOREIGN KEY (`language_code`) REFERENCES `languages`(`code`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `uq_category_slug_per_lang` ON `category_translations`(`language_code`, `slug`);

-- Products + translations
CREATE TABLE `products` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(64) NOT NULL,
  `category_id` BIGINT NULL,
  `price` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `products_sku_key`(`sku`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_translations` (
  `product_id` BIGINT NOT NULL,
  `language_code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `short_description` VARCHAR(500) NULL,
  `description` TEXT NULL,
  PRIMARY KEY (`product_id`, `language_code`),
  CONSTRAINT `fk_pt_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pt_language` FOREIGN KEY (`language_code`) REFERENCES `languages`(`code`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `uq_product_slug_per_lang` ON `product_translations`(`language_code`, `slug`);
CREATE INDEX `idx_product_translation_lang` ON `product_translations`(`language_code`);

-- Attributes
CREATE TABLE `attribute_keys` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `value_type` VARCHAR(20) NOT NULL DEFAULT 'text',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `attribute_keys_code_key`(`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `attribute_key_translations` (
  `attribute_key_id` BIGINT NOT NULL,
  `language_code` VARCHAR(10) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  PRIMARY KEY (`attribute_key_id`, `language_code`),
  CONSTRAINT `fk_akt_key` FOREIGN KEY (`attribute_key_id`) REFERENCES `attribute_keys`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_akt_lang` FOREIGN KEY (`language_code`) REFERENCES `languages`(`code`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_attributes` (
  `product_id` BIGINT NOT NULL,
  `attribute_key_id` BIGINT NOT NULL,
  `value_text` TEXT NULL,
  `value_number` DECIMAL(18,4) NULL,
  `value_boolean` BOOLEAN NULL,
  `value_json` TEXT NULL,
  PRIMARY KEY (`product_id`, `attribute_key_id`),
  CONSTRAINT `fk_pa_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pa_key` FOREIGN KEY (`attribute_key_id`) REFERENCES `attribute_keys`(`id`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_product_attribute_key` ON `product_attributes`(`attribute_key_id`);

-- Ingredients
CREATE TABLE `ingredient_keys` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ingredient_keys_code_key`(`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ingredient_key_translations` (
  `ingredient_key_id` BIGINT NOT NULL,
  `language_code` VARCHAR(10) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  PRIMARY KEY (`ingredient_key_id`, `language_code`),
  CONSTRAINT `fk_ikt_key` FOREIGN KEY (`ingredient_key_id`) REFERENCES `ingredient_keys`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ikt_lang` FOREIGN KEY (`language_code`) REFERENCES `languages`(`code`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_ingredients` (
  `product_id` BIGINT NOT NULL,
  `ingredient_key_id` BIGINT NOT NULL,
  `value` VARCHAR(255) NULL,
  `note` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`product_id`, `ingredient_key_id`),
  CONSTRAINT `fk_pi_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pi_key` FOREIGN KEY (`ingredient_key_id`) REFERENCES `ingredient_keys`(`id`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_product_ingredient_sort` ON `product_ingredients`(`product_id`, `sort_order`);

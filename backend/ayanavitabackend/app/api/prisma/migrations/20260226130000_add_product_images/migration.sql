CREATE TABLE `product_images` (
                                  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                  `product_id` BIGINT UNSIGNED NOT NULL,
                                  `image_url` VARCHAR(500) NOT NULL,
                                  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
                                  `sort_order` INT NOT NULL DEFAULT 0,

                                  PRIMARY KEY (`id`),
                                  INDEX `idx_product_images_sort` (`product_id`, `sort_order`),
                                  INDEX `idx_product_images_product` (`product_id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
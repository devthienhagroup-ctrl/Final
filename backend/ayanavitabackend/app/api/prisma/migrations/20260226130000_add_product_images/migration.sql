CREATE TABLE IF NOT EXISTS `product_images` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `primary_flag` BIGINT GENERATED ALWAYS AS (
        CASE WHEN `is_primary` = TRUE THEN `product_id` ELSE NULL END
    ) STORED,

    INDEX `idx_product_images_sort`(`product_id`, `sort_order`),
    UNIQUE INDEX `ux_one_primary_per_product`(`primary_flag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

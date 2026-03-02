ALTER TABLE `ProductOrder`
  ADD COLUMN `processedByUserId` INT NULL;

ALTER TABLE `ProductOrder`
  MODIFY `status` ENUM('PENDING','CANCEL_REQUESTED','PENDING_PAYMENT','PAID','SHIPPING','SUCCESS','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING_PAYMENT';

CREATE INDEX `ProductOrder_processedByUserId_idx` ON `ProductOrder`(`processedByUserId`);

ALTER TABLE `ProductOrder`
  ADD CONSTRAINT `ProductOrder_processedByUserId_fkey`
  FOREIGN KEY (`processedByUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

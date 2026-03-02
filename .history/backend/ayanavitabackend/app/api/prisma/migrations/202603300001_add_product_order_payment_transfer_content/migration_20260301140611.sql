ALTER TABLE `ProductOrderPayment`
  ADD COLUMN `tranferContent` VARCHAR(128) NULL;

UPDATE `ProductOrderPayment`
SET `tranferContent` = CONCAT('ID', `id`, 'ProductOrderPayment')
WHERE `tranferContent` IS NULL;

ALTER TABLE `ProductOrderPayment`
  MODIFY `tranferContent` VARCHAR(128) NOT NULL,
  ADD UNIQUE INDEX `ProductOrderPayment_tranferContent_key` (`tranferContent`);

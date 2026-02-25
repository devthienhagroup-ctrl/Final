-- Drop unique index first, then remove service code column
DROP INDEX `Service_code_key` ON `Service`;

ALTER TABLE `Service`
  DROP COLUMN `code`;

-- AlterTable
ALTER TABLE `CmsSectionLocale` MODIFY `locale` ENUM('vi', 'en', 'de') NOT NULL;

-- AlterTable
ALTER TABLE `CmsSectionVersion` MODIFY `locale` ENUM('vi', 'en', 'de') NOT NULL;

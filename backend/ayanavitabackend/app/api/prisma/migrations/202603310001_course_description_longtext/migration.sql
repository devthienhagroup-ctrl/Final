-- Expand Course.description to support very long text content (equivalent to varchar(max) intent)
ALTER TABLE `Course`
  MODIFY `description` LONGTEXT NULL;

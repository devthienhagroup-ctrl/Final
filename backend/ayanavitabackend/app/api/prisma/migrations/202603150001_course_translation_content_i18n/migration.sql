ALTER TABLE `CourseTranslation`
  ADD COLUMN `objectives` JSON NULL,
  ADD COLUMN `targetAudience` JSON NULL,
  ADD COLUMN `benefits` JSON NULL;

UPDATE `CourseTranslation` ct
INNER JOIN `CourseContentTranslation` cct
  ON cct.`courseId` = ct.`courseId`
 AND cct.`locale` = ct.`locale`
SET
  ct.`objectives` = cct.`objectives`,
  ct.`targetAudience` = cct.`targetAudience`,
  ct.`benefits` = cct.`benefits`;

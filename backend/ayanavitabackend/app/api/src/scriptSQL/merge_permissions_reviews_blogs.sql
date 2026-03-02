-- Merge permissions cho quản lý đánh giá và quản lý blog
INSERT INTO `Permission` (`code`, `resource`, `action`)
VALUES
  ('reviews.read', 'reviews', 'read'),
  ('reviews.manage', 'reviews', 'manage'),
  ('blogs.read', 'blogs', 'read'),
  ('blogs.write', 'blogs', 'write'),
  ('blogs.manage', 'blogs', 'manage')
ON DUPLICATE KEY UPDATE
  `resource` = VALUES(`resource`),
  `action` = VALUES(`action`);

-- Gán quyền cho role SUPPORT
INSERT IGNORE INTO `RolePermission` (`roleId`, `permissionId`)
SELECT r.`id`, p.`id`
FROM `RbacRole` r
JOIN `Permission` p ON p.`code` IN ('reviews.read', 'reviews.manage', 'blogs.read')
WHERE r.`code` = 'SUPPORT';

-- Gán quyền cho role OPS
INSERT IGNORE INTO `RolePermission` (`roleId`, `permissionId`)
SELECT r.`id`, p.`id`
FROM `RbacRole` r
JOIN `Permission` p ON p.`code` IN ('reviews.read', 'reviews.manage', 'blogs.read', 'blogs.write', 'blogs.manage')
WHERE r.`code` = 'OPS';

-- Gán quyền cho role ADMIN
INSERT IGNORE INTO `RolePermission` (`roleId`, `permissionId`)
SELECT r.`id`, p.`id`
FROM `RbacRole` r
JOIN `Permission` p ON p.`code` IN ('reviews.read', 'reviews.manage', 'blogs.read', 'blogs.write', 'blogs.manage')
WHERE r.`code` = 'ADMIN';

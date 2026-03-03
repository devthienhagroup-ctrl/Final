INSERT INTO `Permission` (`code`, `resource`, `action`, `createdAt`, `updatedAt`)
SELECT 'dashboard.admin', 'dashboard', 'admin', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `Permission` WHERE `code` = 'dashboard.admin'
);

INSERT INTO `RolePermission` (`roleId`, `permissionId`)
SELECT r.`id`, p.`id`
FROM `Role` r
JOIN `Permission` p ON p.`code` = 'dashboard.admin'
WHERE r.`code` = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM `RolePermission` rp
    WHERE rp.`roleId` = r.`id`
      AND rp.`permissionId` = p.`id`
  );

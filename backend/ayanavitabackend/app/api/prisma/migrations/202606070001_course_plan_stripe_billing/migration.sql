-- User: map 1 user -> 1 Stripe customer
ALTER TABLE `User`
  ADD COLUMN `stripeCustomerId` VARCHAR(64) NULL,
  ADD UNIQUE INDEX `User_stripeCustomerId_key`(`stripeCustomerId`);

-- Course plan billing metadata
ALTER TABLE `CoursePlan`
  ADD COLUMN `currency` VARCHAR(8) NOT NULL DEFAULT 'vnd',
  ADD COLUMN `billingInterval` ENUM('month', 'year') NOT NULL DEFAULT 'month',
  ADD COLUMN `stripeProductId` VARCHAR(64) NULL,
  ADD COLUMN `currentStripePriceId` VARCHAR(64) NULL;

-- Keep history of Stripe prices for each plan
CREATE TABLE `CoursePlanPriceVersion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `planId` INT NOT NULL,
  `stripeProductId` VARCHAR(64) NOT NULL,
  `stripePriceId` VARCHAR(64) NOT NULL,
  `amount` INT NOT NULL,
  `currency` VARCHAR(8) NOT NULL,
  `billingInterval` ENUM('month', 'year') NOT NULL,
  `isCurrent` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `CoursePlanPriceVersion_stripePriceId_key`(`stripePriceId`),
  INDEX `CoursePlanPriceVersion_planId_createdAt_idx`(`planId`, `createdAt`),
  INDEX `CoursePlanPriceVersion_planId_isCurrent_idx`(`planId`, `isCurrent`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CoursePlanPriceVersion`
  ADD CONSTRAINT `CoursePlanPriceVersion_planId_fkey`
  FOREIGN KEY (`planId`) REFERENCES `CoursePlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Subscription state synced from Stripe webhooks
CREATE TABLE `UserPlanSubscription` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `planId` INT NOT NULL,
  `stripeCustomerId` VARCHAR(64) NOT NULL,
  `stripeSubscriptionId` VARCHAR(128) NOT NULL,
  `stripePriceId` VARCHAR(128) NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'incomplete',
  `currentPeriodStart` DATETIME(3) NULL,
  `currentPeriodEnd` DATETIME(3) NULL,
  `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
  `canceledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `UserPlanSubscription_stripeSubscriptionId_key`(`stripeSubscriptionId`),
  INDEX `UserPlanSubscription_userId_status_idx`(`userId`, `status`),
  INDEX `UserPlanSubscription_planId_status_idx`(`planId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserPlanSubscription`
  ADD CONSTRAINT `UserPlanSubscription_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `UserPlanSubscription_planId_fkey`
  FOREIGN KEY (`planId`) REFERENCES `CoursePlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Webhook idempotency log
CREATE TABLE `StripeWebhookEventLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `stripeEventId` VARCHAR(128) NOT NULL,
  `type` VARCHAR(120) NOT NULL,
  `handled` BOOLEAN NOT NULL DEFAULT false,
  `payload` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `handledAt` DATETIME(3) NULL,
  UNIQUE INDEX `StripeWebhookEventLog_stripeEventId_key`(`stripeEventId`),
  INDEX `StripeWebhookEventLog_type_createdAt_idx`(`type`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Extend course plan payments for Stripe one-time + subscription events
ALTER TABLE `CoursePlanPayment`
  ADD COLUMN `stripeCheckoutSessionId` VARCHAR(128) NULL,
  ADD COLUMN `stripePaymentIntentId` VARCHAR(128) NULL,
  ADD COLUMN `stripeInvoiceId` VARCHAR(128) NULL,
  ADD COLUMN `stripeSubscriptionId` VARCHAR(128) NULL,
  ADD COLUMN `failureReason` VARCHAR(255) NULL,
  ADD COLUMN `reminderSentAt` DATETIME(3) NULL,
  ADD COLUMN `successEmailSentAt` DATETIME(3) NULL,
  ADD COLUMN `failureEmailSentAt` DATETIME(3) NULL,
  ADD UNIQUE INDEX `CoursePlanPayment_stripeCheckoutSessionId_key`(`stripeCheckoutSessionId`),
  ADD UNIQUE INDEX `CoursePlanPayment_stripeInvoiceId_key`(`stripeInvoiceId`),
  ADD INDEX `CoursePlanPayment_stripeSubscriptionId_idx`(`stripeSubscriptionId`);

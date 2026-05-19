-- ============================================================
-- SOCOBOS Boarding House Management System
-- Database: socobos-api
-- Run this in phpMyAdmin → SQL tab
-- ============================================================

CREATE DATABASE IF NOT EXISTS `socobos-api`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `socobos-api`;

-- ── Rooms ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rooms` (
  `id`                VARCHAR(64)    NOT NULL PRIMARY KEY,
  `number`            VARCHAR(20)    NOT NULL UNIQUE,
  `monthlyRent`       DECIMAL(10,2)  NOT NULL DEFAULT 3500.00,
  `status`            ENUM('vacant','occupied') NOT NULL DEFAULT 'vacant',
  `currentTenancyId`  VARCHAR(64)    DEFAULT NULL,
  `createdAt`         TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Tenancies ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tenancies` (
  `id`                  VARCHAR(64)   NOT NULL PRIMARY KEY,
  `roomId`              VARCHAR(64)   NOT NULL,
  `roomNumber`          VARCHAR(20)   NOT NULL,
  `tenantName`          VARCHAR(120)  NOT NULL,
  `tenantPhone`         VARCHAR(30)   NOT NULL,
  `moveInDate`          DATE          NOT NULL,
  `moveOutDate`         DATE          DEFAULT NULL,
  `status`              ENUM('active','moved_out') NOT NULL DEFAULT 'active',
  `securityDeposit`     DECIMAL(10,2) NOT NULL DEFAULT 3500.00,
  `advancePayment`      DECIMAL(10,2) NOT NULL DEFAULT 3500.00,
  `initialPaymentsPaid` TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Bills ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bills` (
  `id`               VARCHAR(64)   NOT NULL PRIMARY KEY,
  `tenancyId`        VARCHAR(64)   NOT NULL,
  `roomId`           VARCHAR(64)   NOT NULL,
  `roomNumber`       VARCHAR(20)   NOT NULL,
  `month`            VARCHAR(7)    NOT NULL,   -- YYYY-MM
  `prevElectricity`  DECIMAL(10,2) NOT NULL DEFAULT 0,
  `currElectricity`  DECIMAL(10,2) NOT NULL DEFAULT 0,
  `prevWater`        DECIMAL(10,2) NOT NULL DEFAULT 0,
  `currWater`        DECIMAL(10,2) NOT NULL DEFAULT 0,
  `electricityRate`  DECIMAL(10,2) NOT NULL DEFAULT 12.00,
  `waterRate`        DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  `rentAmount`       DECIMAL(10,2) NOT NULL,
  `electricityCost`  DECIMAL(10,2) NOT NULL DEFAULT 0,
  `waterCost`        DECIMAL(10,2) NOT NULL DEFAULT 0,
  `totalAmount`      DECIMAL(10,2) NOT NULL,
  `amountPaid`       DECIMAL(10,2) NOT NULL DEFAULT 0,
  `balance`          DECIMAL(10,2) NOT NULL,
  `status`           ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
  `dueDate`          DATE          NOT NULL,
  `generatedAt`      DATE          NOT NULL,
  FOREIGN KEY (`tenancyId`) REFERENCES `tenancies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Payments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payments` (
  `id`          VARCHAR(64)   NOT NULL PRIMARY KEY,
  `billId`      VARCHAR(64)   NOT NULL,
  `tenancyId`   VARCHAR(64)   NOT NULL,
  `roomNumber`  VARCHAR(20)   NOT NULL,
  `tenantName`  VARCHAR(120)  NOT NULL,
  `amount`      DECIMAL(10,2) NOT NULL,
  `date`        DATE          NOT NULL,
  `note`        VARCHAR(255)  DEFAULT NULL,
  `createdAt`   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`billId`) REFERENCES `bills`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Rates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rates` (
  `id`               INT           NOT NULL PRIMARY KEY DEFAULT 1,
  `electricityRate`  DECIMAL(10,2) NOT NULL DEFAULT 12.00,
  `waterRate`        DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  `updatedAt`        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Owner / Auth ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `owner` (
  `id`           INT          NOT NULL PRIMARY KEY DEFAULT 1,
  `passwordHash` VARCHAR(255) NOT NULL,
  `token`        VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

-- Seed default rates row
INSERT IGNORE INTO `rates` (`id`, `electricityRate`, `waterRate`) VALUES (1, 12.00, 20.00);

-- Seed owner password: change 'yourpassword' to your real password before running
-- This uses PHP's PASSWORD_DEFAULT hash — update via the app's rates screen or run:
-- UPDATE owner SET passwordHash = '$2y$10$...' WHERE id = 1;
-- For now insert a placeholder (you'll set it via the API setup endpoint)
INSERT IGNORE INTO `owner` (`id`, `passwordHash`) VALUES (1, '');

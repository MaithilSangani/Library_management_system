/*
  Warnings:

  - The values [READ] on the enum `notification_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `notification` MODIFY `status` ENUM('UNREAD', 'read') NOT NULL DEFAULT 'UNREAD';

-- CreateTable
CREATE TABLE `payment` (
    `paymentId` INTEGER NOT NULL AUTO_INCREMENT,
    `patronId` INTEGER NOT NULL,
    `transactionId` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `paymentType` ENUM('MEMBERSHIP_FEE', 'PROCESSING_FEE', 'LATE_FEE', 'FINE', 'DAMAGE_FEE', 'LOST_BOOK_FEE', 'OTHER') NOT NULL,
    `description` VARCHAR(191) NULL,
    `paymentStatus` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NULL,
    `paidDate` DATETIME(3) NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payment_patronId_idx`(`patronId`),
    INDEX `Payment_transactionId_idx`(`transactionId`),
    INDEX `Payment_paymentStatus_idx`(`paymentStatus`),
    INDEX `Payment_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`paymentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `Payment_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `Payment_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transaction`(`transactionId`) ON DELETE SET NULL ON UPDATE CASCADE;

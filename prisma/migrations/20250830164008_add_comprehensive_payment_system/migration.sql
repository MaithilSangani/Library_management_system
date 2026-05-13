-- CreateTable
CREATE TABLE `Payment` (
    `paymentId` INTEGER NOT NULL AUTO_INCREMENT,
    `patronId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentType` ENUM('FINE', 'MEMBERSHIP_FEE', 'LATE_FEE', 'DAMAGE_FEE', 'PROCESSING_FEE', 'RENEWAL_FEE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `paymentStatus` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `description` VARCHAR(191) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'Online',
    `paymentReference` VARCHAR(191) NULL,
    `transactionId` INTEGER NULL,
    `dueDate` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `processedBy` VARCHAR(191) NULL,

    INDEX `Payment_patronId_idx`(`patronId`),
    INDEX `Payment_paymentType_idx`(`paymentType`),
    INDEX `Payment_paymentStatus_idx`(`paymentStatus`),
    INDEX `Payment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`paymentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transaction`(`transactionId`) ON DELETE SET NULL ON UPDATE CASCADE;

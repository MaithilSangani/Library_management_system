-- CreateTable
CREATE TABLE `FinePayment` (
    `paymentId` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `patronId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'Online',
    `paymentReference` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `processedBy` VARCHAR(191) NULL,

    INDEX `FinePayment_transactionId_idx`(`transactionId`),
    INDEX `FinePayment_patronId_idx`(`patronId`),
    INDEX `FinePayment_paidAt_idx`(`paidAt`),
    PRIMARY KEY (`paymentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FinePayment` ADD CONSTRAINT `FinePayment_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transaction`(`transactionId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinePayment` ADD CONSTRAINT `FinePayment_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

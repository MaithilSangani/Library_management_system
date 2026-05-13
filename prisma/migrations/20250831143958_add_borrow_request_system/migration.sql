-- CreateTable
CREATE TABLE `BorrowRequest` (
    `requestId` INTEGER NOT NULL AUTO_INCREMENT,
    `patronId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processedBy` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `BorrowRequest_patronId_idx`(`patronId`),
    INDEX `BorrowRequest_itemId_idx`(`itemId`),
    INDEX `BorrowRequest_status_idx`(`status`),
    INDEX `BorrowRequest_requestedAt_idx`(`requestedAt`),
    UNIQUE INDEX `BorrowRequest_patronId_itemId_key`(`patronId`, `itemId`),
    PRIMARY KEY (`requestId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `notificationId` INTEGER NOT NULL AUTO_INCREMENT,
    `recipientId` INTEGER NOT NULL,
    `recipientType` VARCHAR(191) NOT NULL,
    `type` ENUM('BORROW_REQUEST', 'BORROW_APPROVED', 'BORROW_REJECTED', 'BOOK_OVERDUE', 'FINE_NOTICE', 'GENERAL') NOT NULL,
    `status` ENUM('UNREAD', 'READ') NOT NULL DEFAULT 'UNREAD',
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `relatedId` INTEGER NULL,
    `relatedType` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    INDEX `Notification_recipientId_recipientType_idx`(`recipientId`, `recipientType`),
    INDEX `Notification_status_idx`(`status`),
    INDEX `Notification_type_idx`(`type`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`notificationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BorrowRequest` ADD CONSTRAINT `BorrowRequest_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BorrowRequest` ADD CONSTRAINT `BorrowRequest_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`itemId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

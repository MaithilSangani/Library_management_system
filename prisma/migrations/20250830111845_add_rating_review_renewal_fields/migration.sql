-- AlterTable
ALTER TABLE `item` ADD COLUMN `condition` ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNUSABLE') NOT NULL DEFAULT 'EXCELLENT',
    ADD COLUMN `maintenanceNotes` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `rating` INTEGER NULL,
    ADD COLUMN `renewalCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `review` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `wishlist` (
    `wishlistId` INTEGER NOT NULL AUTO_INCREMENT,
    `patronId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `priority` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    `notes` VARCHAR(191) NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Wishlist_patronId_fkey`(`patronId`),
    INDEX `Wishlist_itemId_fkey`(`itemId`),
    UNIQUE INDEX `Wishlist_patronId_itemId_key`(`patronId`, `itemId`),
    PRIMARY KEY (`wishlistId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemStatusHistory` (
    `historyId` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('AVAILABLE', 'BORROWED', 'RESERVED', 'OVERDUE', 'UNDER_MAINTENANCE', 'DAMAGED', 'LOST', 'OUT_OF_STOCK') NOT NULL,
    `previousStatus` ENUM('AVAILABLE', 'BORROWED', 'RESERVED', 'OVERDUE', 'UNDER_MAINTENANCE', 'DAMAGED', 'LOST', 'OUT_OF_STOCK') NULL,
    `reason` VARCHAR(191) NULL,
    `changedBy` VARCHAR(191) NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `itemId` INTEGER NOT NULL,

    PRIMARY KEY (`historyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `wishlist` ADD CONSTRAINT `Wishlist_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist` ADD CONSTRAINT `Wishlist_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`itemId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemStatusHistory` ADD CONSTRAINT `ItemStatusHistory_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`itemId`) ON DELETE RESTRICT ON UPDATE CASCADE;

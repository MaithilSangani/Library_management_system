-- CreateTable
CREATE TABLE `Patron` (
    `patronId` INTEGER NOT NULL AUTO_INCREMENT,
    `patronEmail` VARCHAR(191) NOT NULL,
    `patronPassword` VARCHAR(191) NOT NULL,
    `patronFirstName` VARCHAR(191) NOT NULL,
    `patronLastName` VARCHAR(191) NOT NULL,
    `isStudent` BOOLEAN NOT NULL DEFAULT false,
    `isFaculty` BOOLEAN NOT NULL DEFAULT false,
    `patronCreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `patronUpdatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Patron_patronEmail_key`(`patronEmail`),
    PRIMARY KEY (`patronId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `adminId` INTEGER NOT NULL AUTO_INCREMENT,
    `adminEmail` VARCHAR(191) NOT NULL,
    `adminPassword` VARCHAR(191) NOT NULL,
    `adminFirstName` VARCHAR(191) NOT NULL,
    `adminLastName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Admin_adminEmail_key`(`adminEmail`),
    PRIMARY KEY (`adminId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Librarian` (
    `librarianId` INTEGER NOT NULL AUTO_INCREMENT,
    `librarianEmail` VARCHAR(191) NOT NULL,
    `librarianPassword` VARCHAR(191) NOT NULL,
    `librarianFirstName` VARCHAR(191) NOT NULL,
    `librarianLastName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Librarian_librarianEmail_key`(`librarianEmail`),
    PRIMARY KEY (`librarianId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `studentId` INTEGER NOT NULL AUTO_INCREMENT,
    `studentDepartment` VARCHAR(191) NULL,
    `studentSemester` INTEGER NULL,
    `studentRollNo` INTEGER NULL,
    `studentEnrollmentNumber` INTEGER NULL,
    `studentProfileImage` VARCHAR(191) NULL,
    `patronId` INTEGER NOT NULL,

    UNIQUE INDEX `Student_studentEnrollmentNumber_key`(`studentEnrollmentNumber`),
    UNIQUE INDEX `Student_patronId_key`(`patronId`),
    PRIMARY KEY (`studentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faculty` (
    `facultyId` INTEGER NOT NULL AUTO_INCREMENT,
    `facultyDepartment` VARCHAR(191) NULL,
    `facultyProfileImage` VARCHAR(191) NULL,
    `patronId` INTEGER NOT NULL,

    UNIQUE INDEX `Faculty_patronId_key`(`patronId`),
    PRIMARY KEY (`facultyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `itemId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `author` VARCHAR(191) NOT NULL,
    `isbn` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `keywords` VARCHAR(191) NULL,
    `itemType` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `totalCopies` INTEGER NOT NULL DEFAULT 1,
    `availableCopies` INTEGER NOT NULL DEFAULT 1,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Item_isbn_key`(`isbn`),
    PRIMARY KEY (`itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `transactionId` INTEGER NOT NULL AUTO_INCREMENT,
    `borrowedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `returnedAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `isReturned` BOOLEAN NOT NULL DEFAULT false,
    `finePaid` DOUBLE NULL,
    `itemId` INTEGER NOT NULL,
    `patronId` INTEGER NOT NULL,

    PRIMARY KEY (`transactionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reservation` (
    `reservationId` INTEGER NOT NULL AUTO_INCREMENT,
    `reservedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `itemId` INTEGER NOT NULL,
    `patronId` INTEGER NOT NULL,

    UNIQUE INDEX `Reservation_itemId_patronId_key`(`itemId`, `patronId`),
    PRIMARY KEY (`reservationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LibrarySettings` (
    `librarySettingsId` INTEGER NOT NULL DEFAULT 1,
    `borrowingLimit` INTEGER NOT NULL DEFAULT 5,
    `loanPeriodDays` INTEGER NOT NULL DEFAULT 14,
    `finePerDay` DOUBLE NOT NULL DEFAULT 1.0,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedByAdminId` INTEGER NULL,

    PRIMARY KEY (`librarySettingsId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `Patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Faculty` ADD CONSTRAINT `Faculty_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `Patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`itemId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `Patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`itemId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_patronId_fkey` FOREIGN KEY (`patronId`) REFERENCES `Patron`(`patronId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LibrarySettings` ADD CONSTRAINT `LibrarySettings_updatedByAdminId_fkey` FOREIGN KEY (`updatedByAdminId`) REFERENCES `Admin`(`adminId`) ON DELETE SET NULL ON UPDATE CASCADE;

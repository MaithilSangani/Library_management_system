-- AlterTable
ALTER TABLE `admin` ADD COLUMN `adminOriginalPassword` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `librarian` ADD COLUMN `librarianOriginalPassword` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `patron` ADD COLUMN `patronOriginalPassword` VARCHAR(191) NULL;

/*
  Warnings:

  - You are about to drop the `finepayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `finepayment` DROP FOREIGN KEY `FinePayment_patronId_fkey`;

-- DropForeignKey
ALTER TABLE `finepayment` DROP FOREIGN KEY `FinePayment_transactionId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_patronId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_transactionId_fkey`;

-- DropTable
DROP TABLE `finepayment`;

-- DropTable
DROP TABLE `payment`;

/*
  Warnings:

  - Added the required column `author` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Review` ADD COLUMN `author` VARCHAR(191) NOT NULL;

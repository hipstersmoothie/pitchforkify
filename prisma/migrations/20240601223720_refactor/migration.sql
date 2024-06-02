/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AccountToPlayedAlbum` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AccountToSavedAlbum` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `SavedAlbum` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PlayedAlbum` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `SavedAlbum` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `Account`;

-- DropTable
DROP TABLE `Session`;

-- DropTable
DROP TABLE `VerificationToken`;

-- DropTable
DROP TABLE `_AccountToPlayedAlbum`;

-- DropTable
DROP TABLE `_AccountToSavedAlbum`;

-- CreateIndex
CREATE INDEX `PlayedAlbum_userId_idx` ON `PlayedAlbum`(`userId`);

-- CreateIndex
CREATE INDEX `SavedAlbum_userId_idx` ON `SavedAlbum`(`userId`);

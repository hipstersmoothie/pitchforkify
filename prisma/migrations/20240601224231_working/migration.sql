/*
  Warnings:

  - The primary key for the `PlayedAlbum` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SavedAlbum` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[uri,userId]` on the table `PlayedAlbum` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uri,userId]` on the table `SavedAlbum` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `PlayedAlbum` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `PlayedAlbum_uri_key` ON `PlayedAlbum`;

-- DropIndex
DROP INDEX `SavedAlbum_uri_key` ON `SavedAlbum`;

-- AlterTable
ALTER TABLE `PlayedAlbum` DROP PRIMARY KEY,
    MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `SavedAlbum` DROP PRIMARY KEY;

-- CreateIndex
CREATE UNIQUE INDEX `PlayedAlbum_uri_userId_key` ON `PlayedAlbum`(`uri`, `userId`);

-- CreateIndex
CREATE UNIQUE INDEX `SavedAlbum_uri_userId_key` ON `SavedAlbum`(`uri`, `userId`);

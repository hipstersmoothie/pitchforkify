/*
  Warnings:

  - You are about to alter the column `publishDate` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to drop the `ArtistOnReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GenreOnReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LabelOnReview` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `Review` MODIFY `publishDate` DATETIME(3) NOT NULL;

-- DropTable
DROP TABLE `ArtistOnReview`;

-- DropTable
DROP TABLE `GenreOnReview`;

-- DropTable
DROP TABLE `LabelOnReview`;

-- CreateTable
CREATE TABLE `_LabelToReview` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_LabelToReview_AB_unique`(`A`, `B`),
    INDEX `_LabelToReview_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArtistToReview` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtistToReview_AB_unique`(`A`, `B`),
    INDEX `_ArtistToReview_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_GenreToReview` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_GenreToReview_AB_unique`(`A`, `B`),
    INDEX `_GenreToReview_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

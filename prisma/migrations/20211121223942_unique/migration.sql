/*
  Warnings:

  - A unique constraint covering the columns `[albumTitle,publishDate]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Review_albumTitle_publishDate_key` ON `Review`(`albumTitle`, `publishDate`);

/*
  Warnings:

  - You are about to alter the column `score` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `Review` MODIFY `score` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `SavedAlbum` (
    `uri` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SavedAlbum_uri_key`(`uri`),
    PRIMARY KEY (`uri`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AccountToSavedAlbum` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AccountToSavedAlbum_AB_unique`(`A`, `B`),
    INDEX `_AccountToSavedAlbum_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

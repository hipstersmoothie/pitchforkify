-- CreateTable
CREATE TABLE `PlayedAlbum` (
    `uri` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PlayedAlbum_uri_key`(`uri`),
    PRIMARY KEY (`uri`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AccountToPlayedAlbum` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AccountToPlayedAlbum_AB_unique`(`A`, `B`),
    INDEX `_AccountToPlayedAlbum_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

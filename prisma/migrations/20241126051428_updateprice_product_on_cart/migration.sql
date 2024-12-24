/*
  Warnings:

  - You are about to drop the column `pricee` on the `productoncart` table. All the data in the column will be lost.
  - Added the required column `price` to the `ProductOnCart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `productoncart` DROP COLUMN `pricee`,
    ADD COLUMN `price` DOUBLE NOT NULL;

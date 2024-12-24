/*
  Warnings:

  - You are about to drop the column `Price` on the `product` table. All the data in the column will be lost.
  - Added the required column `price` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product` DROP COLUMN `Price`,
    ADD COLUMN `price` DOUBLE NOT NULL;

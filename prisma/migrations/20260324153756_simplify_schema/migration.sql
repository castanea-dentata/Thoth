/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoryItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Library` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `List` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_libraryId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryItem" DROP CONSTRAINT "CategoryItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryItem" DROP CONSTRAINT "CategoryItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_libraryId_fkey";

-- DropForeignKey
ALTER TABLE "Library" DROP CONSTRAINT "Library_userId_fkey";

-- DropForeignKey
ALTER TABLE "List" DROP CONSTRAINT "List_libraryId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "library" JSONB,
ADD COLUMN     "syncToken" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "token" TEXT;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "CategoryItem";

-- DropTable
DROP TABLE "Item";

-- DropTable
DROP TABLE "Library";

-- DropTable
DROP TABLE "List";

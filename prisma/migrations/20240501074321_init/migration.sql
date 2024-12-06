-- CreateTable
CREATE TABLE "Connections" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT,
    "companyId" TEXT,
    "tokenDetails" TEXT,
    "createdDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "modifiedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "modifiedBy" TEXT,
    "status" TEXT,
    "userId" INTEGER,
    "isActiveConnection" BOOLEAN DEFAULT false,

    CONSTRAINT "Connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "password" TEXT,
    "createdDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "modifiedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "modifiedBy" TEXT,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "token" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemInventory" (
    "id" SERIAL NOT NULL,
    "companyId" TEXT NOT NULL,
    "averageCost" DOUBLE PRECISION,
    "editSequence" TEXT,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "listID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchaseCost" DOUBLE PRECISION,
    "quantityOnHand" TEXT,
    "quantityOnOrder" INTEGER,
    "quantityOnSalesOrder" INTEGER,
    "reorderPoint" INTEGER,
    "salesDescription" TEXT,
    "salesPrice" DOUBLE PRECISION,
    "sublevel" INTEGER,
    "timeCreated" TIMESTAMP(3) NOT NULL,
    "timeModified" TIMESTAMP(3) NOT NULL,
    "createdDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "modifiedDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Connections_companyId_key" ON "Connections"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ItemInventory_listID_key" ON "ItemInventory"("listID");

-- AddForeignKey
ALTER TABLE "Connections" ADD CONSTRAINT "Connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

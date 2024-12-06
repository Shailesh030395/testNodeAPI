import envConfig from "../../envConfig";
import { prisma } from "../config/conn";
import { comparePassword } from "../helper/passwordHelper";
import soapRepository from "./soapRepository";

class SoapRepo {
  // async createItemInventory(data: any) {
  //   try {
  //     await prisma.itemInventory.upsert({
  //       where: { fullName: data?.FullName },
  //       update: {
  //         listID: data.ListID,
  //         modifiedDate: new Date(),
  //         timeCreated: data.TimeCreated,
  //         timeModified: data.TimeModified,
  //         companyId: process.env.COMPANY_ID,
  //         editSequence: data.EditSequence,
  //         salesDescription: data.SalesDesc,
  //         name: data.Name,
  //         isActive: data.IsActive === "true",
  //         sublevel: parseInt(data.Sublevel),
  //         salesPrice: parseFloat(data.SalesPrice),
  //         purchaseCost: parseFloat(data.PurchaseCost),
  //         reorderPoint: parseInt(data.ReorderPoint),
  //         quantityOnHand: data.QuantityOnHand,
  //         averageCost: parseFloat(data.AverageCost),
  //         quantityOnOrder: parseInt(data.QuantityOnOrder),
  //         quantityOnSalesOrder: parseInt(data.QuantityOnSalesOrder),
  //       },
  //       create: {
  //         listID: data.ListID,
  //         timeCreated: data.TimeCreated,
  //         timeModified: data.TimeModified,
  //         companyId: envConfig.companyId,
  //         editSequence: data.EditSequence,
  //         salesDescription: data.SalesDesc,
  //         name: data.Name,
  //         fullName: data.FullName,
  //         isActive: data.IsActive === "true",
  //         sublevel: parseInt(data.Sublevel),
  //         salesPrice: parseFloat(data.SalesPrice),
  //         purchaseCost: parseFloat(data.PurchaseCost),
  //         reorderPoint: parseInt(data.ReorderPoint),
  //         quantityOnHand: data.QuantityOnHand,
  //         inventorySiteDetails: {},
  //         averageCost: parseFloat(data.AverageCost),
  //         quantityOnOrder: parseInt(data.QuantityOnOrder),
  //         quantityOnSalesOrder: parseInt(data.QuantityOnSalesOrder),
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error creating item inventory:", error);
  //   }
  // }

  async createItemInventory(data: any) {
    try {
      await prisma.itemInventory.upsert({
        where: { fullName: data?.FullName },
        update: {
          listID: data.ListID,
          modifiedDate: new Date(),
          timeCreated: data.TimeCreated,
          timeModified: data.TimeModified,
          companyId: process.env.COMPANY_ID,
          editSequence: data.EditSequence,
          salesDescription: data.SalesDesc,
          name: data.Name,
          category: data.ProductCategory,
          isActive: data.IsActive === "true",
          sublevel: parseInt(data.Sublevel),
          salesPrice: parseFloat(data.SalesPrice),
          purchaseCost: parseFloat(data.PurchaseCost),
          reorderPoint: parseInt(data.ReorderPoint),
          quantityOnHand: data.QuantityOnHand,
          averageCost: parseFloat(data.AverageCost),
          quantityOnOrder: parseInt(data.QuantityOnOrder),
          quantityOnSalesOrder: parseInt(data.QuantityOnSalesOrder),
          inventorySiteDetails: data.InventorySiteDetails,
        },
        create: {
          listID: data.ListID,
          timeCreated: data.TimeCreated,
          timeModified: data.TimeModified,
          companyId: process.env.COMPANY_ID,
          editSequence: data.EditSequence,
          salesDescription: data.SalesDesc,
          name: data.Name,
          fullName: data.FullName,
          category: data?.Category,
          isActive: data.IsActive === "true",
          sublevel: parseInt(data.Sublevel),
          salesPrice: parseFloat(data.SalesPrice),
          purchaseCost: parseFloat(data.PurchaseCost),
          reorderPoint: parseInt(data.ReorderPoint),
          quantityOnHand: data.QuantityOnHand,
          inventorySiteDetails: data.InventorySiteDetails || {},
          averageCost: parseFloat(data.AverageCost),
          quantityOnOrder: parseInt(data.QuantityOnOrder),
          quantityOnSalesOrder: parseInt(data.QuantityOnSalesOrder),
        },
      });
    } catch (error) {
      console.error("Error creating item inventory:", error);
    }
  }

  async upsertProductWarrantyDetails(
    data: {
      invoiceNumber: string;
      invoiceReferenceNumber: string;
      invoiceDate: Date;
      itemName: string;
      itemDesc: string;
      serialNumber: string;
      customerName: string;
      invoiceData: object;
      companyId: string;
      productCategory: string;
      countryCode: string;
      expiryDate: Date;
      isExtendWarranty?: boolean;
      extendedWarrantyMonths?: number | null;
      extendedBy?: number | null;
    },
    companyId: string
  ) {
    return await prisma.productWarrantyDetails.upsert({
      where: {
        // The unique composite constraint for companyId and serialNumber
        companyId_serialNumber_itemName_customerName: {
          companyId: companyId,
          serialNumber: data.serialNumber,
          itemName: data.itemName,
          customerName: data.customerName,
        },
      },
      update: {
        invoiceNumber: data.invoiceNumber,
        invoiceReferenceNumber: data.invoiceReferenceNumber,
        invoiceDate: data.invoiceDate,
        itemName: data.itemName,
        itemDesc: data.itemDesc,
        customerName: data.customerName,
        invoiceData: data.invoiceData,
        productCategory: data.productCategory,
        countryCode: data.countryCode,
        extendedBy: data.extendedBy,
        updatedAt: new Date(),
      },
      create: {
        invoiceNumber: data.invoiceNumber,
        invoiceReferenceNumber: data.invoiceReferenceNumber,
        invoiceDate: data.invoiceDate,
        itemName: data.itemName,
        itemDesc: data.itemDesc,
        serialNumber: data.serialNumber,
        customerName: data.customerName,
        invoiceData: data.invoiceData,
        companyId: companyId,
        productCategory: data.productCategory,
        countryCode: data.countryCode,
        expiryDate: data.expiryDate,
        isExtendWarranty: data.isExtendWarranty ?? false,
        extendedWarrantyMonths: data.extendedWarrantyMonths,
        extendedBy: data.extendedBy,
        createdAt: new Date(), // Add createdAt when creating
      },
    });
  }

  async getLastSyncDate() {
    try {
      const lastModifiedDate = await prisma.itemInventory.findMany({
        where: { companyId: envConfig.companyId },
        orderBy: { modifiedDate: "desc" },
        take: 1,
      });
      return {
        success: true,
        lastModifiedDate: lastModifiedDate[0]?.modifiedDate || null,
      };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async getLastWarrantySyncDate() {
    try {
      const lastModifiedDate = await prisma.productWarrantyDetails.findMany({
        where: { companyId: envConfig.companyId },
        orderBy: { updatedAt: "desc" },
        take: 1,
      });
      return {
        success: true,
        lastModifiedDate: lastModifiedDate[0]?.updatedAt || null,
      };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async checkWebConnectorCredential(username: any, password: any) {
    try {
      // Use Prisma to find the user by id
      const connection = await prisma.connections.findFirst({
        where: {
          tokenDetails: {
            contains: username,
          },
        },
      });

      // Check if a user with the given id exists
      if (!connection) {
        throw new Error("connection Not Found");
      } else {
        await prisma.connections.update({
          where: {
            id: connection.id,
          },
          data: {
            isActiveConnection: true,
          },
        });
      }

      // Parse the tokenDetails JSON string into an objects
      const tokenDetails = connection?.tokenDetails
        ? JSON.parse(connection.tokenDetails)
        : null;

      if (
        tokenDetails.companyName === username &&
        (await comparePassword(password, tokenDetails.password))
      ) {
        // Return the username and password as a JSON object
        return {
          success: true,
          message: "User authenticated",
          tokenDetails: tokenDetails,
        };
      } else {
        return {
          success: false,
          message: "Invalid credentials",
        };
      }
    } catch (error) {
      // Handle any errors that occur during the database operation
      console.error("Error:", error);
      throw error; // Re-throw the error for the calling code to handle
    }
  }

  async createLog(logDetails: { entityName: string; data: string }) {
    try {
      await prisma.log.create({
        data: {
          entityName: logDetails.entityName,
          data: logDetails.data,
          companyId: envConfig.companyId,
        },
      });
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async updateItemInventorySite(data: any) {
    try {
      for (const item of data) {
        await prisma.itemInventory.updateMany({
          where: { fullName: item.fullName },
          data: {
            inventorySiteDetails: item?.InventorySiteDetails ?? {},
          },
        });
      }
    } catch (error) {
      soapRepository.createLog({
        entityName: "Prisma Error",
        data: JSON.stringify(error),
      });
      console.error("Error creating item inventory:", error);
    }
  }

  async getAllItemInventory() {
    try {
      return await prisma.itemInventory.findMany({
        where: { companyId: envConfig.companyId },
      });
    } catch (error) {
      console.error("Error getting item inventory:", error);
      return [];
    }
  }
}

export default new SoapRepo();

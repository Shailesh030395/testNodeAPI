import { isArray } from "util";
import { prisma } from "../config/conn";
import { CustomError } from "../helper/customError";
import itemRepo from "../repositories/itemRepo";
import { Console } from "console";

class itemService {
  async getItem(
    pageNumber: number,
    searchParams: { fields: string[]; value: string },
    pageSize: number
  ): Promise<any> {
    try {
      const items = await prisma.itemInventory.findMany({
        where: {
          companyId: process.env.COMPANY_ID,
          isActive: true,
          // Check if searchParams.fields is defined and has elements
          OR:
            searchParams &&
            searchParams?.fields &&
            searchParams?.fields?.length > 0
              ? searchParams.fields.map((field) => ({
                  [field]: {
                    contains: searchParams.value,
                    mode: "insensitive",
                  },
                }))
              : undefined,
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      });

      let totalRecords: number;
      if (
        searchParams &&
        searchParams?.fields &&
        searchParams?.fields?.length > 0
      ) {
        // Search based on specified fields
        totalRecords = await prisma.itemInventory.count({
          where: {
            companyId: process.env.COMPANY_ID,
            isActive: true,
            OR: searchParams?.fields.map((field) => ({
              [field]: {
                contains: searchParams.value,
                mode: "insensitive",
              },
            })),
          },
        });
      } else {
        // If no fields specified, fetch all data based on company ID
        totalRecords = await prisma.itemInventory.count({
          where: {
            companyId: process.env.COMPANY_ID,
            isActive: true,
          },
        });
      }

      // const onsiteItems = items.map((item: any) => {
      //   const detail = item.inventorySiteDetails;
      //   if (
      //     detail &&
      //     (detail.FullName === process.env.ITEM_SITE_NAME || detail === "Onsite")
      //   ) {
      //     return {
      //       name: item.fullName,
      //       salesDescription: item.salesDescription ?? null,
      //       quantityOnHand:
      //         detail.QuantityOnHand -
      //         (detail.QuantityOnSalesOrders ?? 0),
      //     };
      //   } else {
      //     return {
      //       name: item.fullName,
      //       salesDescription: item.salesDescription ?? null,
      //       quantityOnHand: "0",
      //     };
      //   }
      // });

      const onsiteItems = items.map((item: any) => {
        let quantityOnHand = 0;
        const detail = item.inventorySiteDetails;

        if (
          detail &&
          Object.keys(detail).length > 0 &&
          (detail.FullName === process.env.ITEM_SITE_NAME ||
            detail.FullName === "Onsite")
        ) {
          quantityOnHand =
            Number(detail.QuantityOnHand) -
            Number(detail.QuantityOnSalesOrders);
        }

        return {
          name: item.fullName,
          salesDescription: item.salesDescription ?? null,
          quantityOnHand: quantityOnHand ?? 0,
        };
      });

      // console.log("items", onsiteItems);
      return { items: onsiteItems, totalRecords };
    } catch (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
  }
}

export default new itemService();

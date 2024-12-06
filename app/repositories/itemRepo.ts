import { prisma } from "../config/conn";

class ItemRepo {
  async fetchUserById(id: number) {
    const userRes = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    return userRes;
  }

  async getItem(
    pageNumber: number,
    pageSize: number,
    searchParams: { fields: string[]; value: string }
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

      const OnsiteItems = items.reduce((acc: any[], item) => {
        const detailedItemArray = item?.inventorySiteDetails
          ? Object.values(item?.inventorySiteDetails)
          : null;
        const matchingDetail = detailedItemArray?.find((detail) => {
          return (
            (detail.FullName == process.env.ITEM_SITE_NAME ||
              detail.FullName == "Onsite") &&
            !detail.InventorySiteLocationRef
          );
        });
        if (matchingDetail) {
          acc.push({
            name: item.fullName,
            salesDescription: item.salesDescription ?? null,
            quantityOnHand:
              matchingDetail.QuantityOnHand -
              matchingDetail.QuantityOnSalesOrders,
          });
        } else {
          acc.push({
            name: item.fullName,
            salesDescription: item.salesDescription ?? null,
            quantityOnHand: "0",
          });
        }
        return acc;
      }, []);

      return { items: OnsiteItems, totalRecords };
    } catch (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
  }

  async findItemsBySearchParams(
    companyId: string,
    searchParams: { fields: string[]; value: string },
    pageNumber: number,
    pageSize: number
  ) {
    const items = await prisma.itemInventory.findMany({
      where: {
        companyId,
        isActive: true,
        OR:
          searchParams && searchParams.fields && searchParams.fields.length > 0
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

    return items;
  }

  async countItemsBySearchParams(
    companyId: string,
    searchParams: { fields: string[]; value: string }
  ) {
    try {
      const totalRecords = await prisma.itemInventory.count({
        where: {
          companyId,
          isActive: true,
          OR:
            searchParams &&
              searchParams.fields &&
              searchParams.fields.length > 0
              ? searchParams.fields.map((field) => ({
                [field]: {
                  contains: searchParams.value,
                  mode: "insensitive",
                },
              }))
              : undefined,
        },
      });

      return totalRecords;
    } catch (error) {
      console.error("Error counting items from repository:", error);
      throw error;
    }
  }
}

export default new ItemRepo();

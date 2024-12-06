import envConfig from "../../envConfig";
import { prisma } from "../config/conn";

class WarrantyRulesRepo {
  // Create a new rule
  async createRule(data: {
    companyId: string;
    userId: number;
    effectiveDate?: Date;
    productCategory?: string;
    countryISOCode?: string;
    customer?: string;
    product?: string;
    warrantyMonth?: string;
    comments?: string;
  }) {
    return prisma.rule.create({
      data: {
        companyId: data.companyId, // Foreign key for company
        userId: data.userId, // Foreign key for user
        ruleName: `${data.customer || ""}_${data.productCategory || ""}_${
          data.product || ""
        }_${data.countryISOCode || ""}`,
        effectiveDate: new Date(data.effectiveDate) || new Date(), // Defaults to today's date if not provided
        productCategory: data.productCategory,
        countryIsoCode: data.countryISOCode,
        customer: data.customer,
        product: data.product,
        warrantyMonth: data.warrantyMonth,
        comments: data.comments, // Comments or notes
      },
    });
  }

  getRules = async (companyId: string) => {
    return prisma.rule.findMany({
      where: {
        companyId: companyId, // Filter by companyId
      },
      orderBy: {
        createdAt: "asc", // Default sorting by creation date (ascending)
      },
    });
  };

  getAllRules = async (
    offset: number,
    limit: number,
    searchParams: { fields: string[]; value: string } // searchParams has fields[] and value
  ) => {
    const { fields, value } = searchParams;

    // Build dynamic search filters based on searchParams.fields[] and value
    const filters = fields.reduce((acc: any, field: string) => {
      acc.OR = acc.OR || [];
      acc.OR.push({
        [field]: {
          contains: value,
          mode: "insensitive",
        },
      });

      if (!value) {
        acc.OR.push({
          [field]: {
            equals: null,
          },
        });
      }

      return acc;
    }, {});

    // Prisma query for total records count
    const totalCount = await prisma.rule.count({
      where: {
        ...filters,
        ruleName: {
          not: "DefaultMonth", // Exclude ruleName with "DefaultMonth"
        }, // Apply the same filters for counting
      },
    });

    // Prisma query with dynamic filters and sorting for paginated results
    const rules = await prisma.rule.findMany({
      skip: offset, // Pagination offset
      take: limit, // Pagination limit
      where: {
        ...filters,
        ruleName: {
          not: "DefaultMonth", // Exclude ruleName with "DefaultMonth"
        }, // Apply dynamic OR filters for search
      },
    });

    return { totalCount, rules };
  };

  // Get a single rule by its ID
  async getARule(id: number) {
    return prisma.rule.findUnique({
      where: {
        id,
      },
    });
  }

  // Get a single rule by its ID
  async getDefaultMonth(id: string) {
    try {
      const defaultWarrantyMonths = prisma.rule
        .findFirst({
          where: {
            companyId: String(id),
            ruleName: "DefaultMonth",
          },
        })
        .catch((error) => {
          console.log(error);
        });
      return defaultWarrantyMonths;
    } catch (e) {
      console.log(e);
    }
  }

  // Update an existing rule
  async updateRule(data: any) {
    return prisma.rule.update({
      where: {
        id: data.id,
      },
      data: {
        ruleName: `${data.customer || ""}_${data.productCategory || ""}_${
          data.product || ""
        }_${data.countryISOCode || ""}`,
        effectiveDate: new Date(data.effectiveDate) || new Date(), // Defaults to today's date if not provided
        productCategory: data.productCategory,
        countryIsoCode: data.countryISOCode,
        customer: data.customer,
        product: data.product,
        warrantyMonth: data.warrantyMonth,
        comments: data.comments,
      },
    });
  }

  bulkAdd = async (
    rulesData: {
      companyId: string;
      userId: number;
      effectiveDate?: Date;
      productCategory?: string;
      countryISOCode?: string;
      customer?: string;
      product?: string;
      warrantyMonth?: string;
      comments?: string;
    }[],
    companyId: number
  ) => {
    const formattedData = rulesData.map((data) => ({
      companyId: envConfig.companyId,
      userId: Number(companyId),
      ruleName: `${data.customer || ""}_${data.productCategory || ""}_${
        data.product || ""
      }_${data.countryISOCode || ""}`,
      effectiveDate: new Date(data.effectiveDate) || new Date(), // Defaults to today's date if not provided
      productCategory: data.productCategory,
      countryIsoCode: data.countryISOCode,
      customer: data.customer,
      product: data.product,
      warrantyMonth: data.warrantyMonth,
      comments: data.comments, // Comments or notes
    }));

    // Using Prisma's createMany method for bulk insertion
    return prisma.rule.createMany({
      data: formattedData,
      skipDuplicates: true, // Optional: Prevents duplicate inserts based on unique constraints
    });
  };

  upsertMonthByRuleName = async (data: any, companyId: string) => {
    // First, try to find a rule by both id and ruleName
    const existingRule = await prisma.rule.findFirst({
      where: {
        ruleName: "DefaultMonth",
      },
    });

    if (existingRule) {
      // If the rule exists, update the warrantyMonth and set other fields to null
      return await prisma.rule.update({
        where: { id: data.id },
        data: {
          warrantyMonth: String(data.warrantyMonth), // Only update warrantyMonth
          productCategory: null,
          countryIsoCode: null,
          customer: null,
          product: null,
          comments: null,
        },
      });
    } else {
      // If the rule does not exist, create a new one
      return prisma.rule.create({
        data: {
          companyId: envConfig.companyId, // Foreign key for company
          user: {
            connect: { id: Number(companyId) }, // Assuming `userId` is the unique identifier for the user
          },
          ruleName: `DefaultMonth`,
          effectiveDate: new Date(), // Defaults to today's date if not provided
          productCategory: null,
          countryIsoCode: null,
          customer: null,
          product: null,
          warrantyMonth: String(data.warrantyMonth),
          comments: null, // Comments or notes
        },
      });
    }
  };

  // Delete a rule by ID
  async deleteRule(ruleId: number) {
    return prisma.rule.delete({
      where: {
        id: ruleId,
      },
    });
  }
}

export default new WarrantyRulesRepo();

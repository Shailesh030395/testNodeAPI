import { PrismaClient, productWarrantyDetails } from "@prisma/client";
import envConfig from "../../envConfig";
import dayjs from "dayjs";
import WarrantyRulesRepo from "./warrantyRulesRepo";
import { skip } from "node:test";
import { invalid } from "moment-timezone";

const prisma = new PrismaClient();

export const getAllWarrantyDetails = async (
  pageNumber: number,
  pageSize: number,
  searchParams: { fields: string[]; value: string } = { fields: [], value: "" }
): Promise<{
  productWarrantyDetails: productWarrantyDetails[];
  totalRecords: number;
}> => {
  const { fields, value } = searchParams;
  const skip = (pageNumber - 1) * pageSize;

  // Dynamically create the filters based on search fields
  const filters = {
    companyId: process.env.COMPANY_ID,
    OR:
      searchParams && searchParams?.fields && searchParams?.fields?.length > 0
        ? searchParams.fields.map((field) => ({
            [field]: {
              contains: searchParams.value,
              mode: "insensitive",
            },
          }))
        : undefined,
  };

  // Fetch the total number of filtered records
  const totalRecords = await prisma.productWarrantyDetails.count({
    where: filters,
  });

  // Fetch paginated results based on filters
  const productWarrantyDetails = await prisma.productWarrantyDetails.findMany({
    where: filters,
    skip,
    take: pageSize,
  });

  return { productWarrantyDetails, totalRecords };
};

export const getWarrantyDetailBySerialNumber = async (
  serialNumber: string,
  ItemName: string
): Promise<productWarrantyDetails | null> => {
  const warrantyDetail = await prisma.productWarrantyDetails.findMany({
    where: {
      serialNumber,
      companyId: envConfig.companyId,
      itemName: ItemName,
    },
  });

  // Explicitly returning null if no data is found
  if (!warrantyDetail) {
    return null;
  }

  return warrantyDetail[0];
};

export const updateWarrantyExpiryDate = async (
  id: number,
  expiryDate: Date
): Promise<productWarrantyDetails | null> => {
  return await prisma.productWarrantyDetails.update({
    where: { id },
    data: { expiryDate },
  });
};

export const updateWarrantyBySerialAndProduct = async (
  WarrantyDataToUpdate,
  companyId
) => {
  // updateWarrantyBySerialAndProduct 1: Extract the serialNumbers from the data to update
  const serialNumbers = WarrantyDataToUpdate.map((item) =>
    String(item.serialNumber)
  );

  // Step 2: Fetch all existing records using serialNumber
  const existingRecords = await prisma.productWarrantyDetails.findMany({
    where: { serialNumber: { in: serialNumbers } },
    select: {
      serialNumber: true,
      expiryDate: true,
      productCategory: true,
      countryCode: true,
      customerName: true,
      itemName: true,
      invoiceDate: true,
    },
  });

  // Step 3: Fetch all rules before processing updates
  const rules = await WarrantyRulesRepo.getRules(String(companyId));

  // Fetch the default warranty month
  const defaultWarrantyMonth: any = await WarrantyRulesRepo.getDefaultMonth(
    envConfig.companyId
  );

  const invalidData = [];
  try {
    const updates = await Promise.all(
      WarrantyDataToUpdate.map(async (item) => {
        const { serialNumber, newExpiryDate, customerName, productName } = item;

        // Find the matching existing record by serialNumber
        const existingRecord = existingRecords.find(
          (record) =>
            record.serialNumber.replace(/\s+/g, "").toLowerCase() ===
              String(serialNumber).replace(/\s+/g, "").toLowerCase() &&
            record.itemName?.replace(/\s+/g, "").toLowerCase() ===
              String(productName).replace(/\s+/g, "").toLowerCase() &&
            record.customerName?.replace(/\s+/g, "").toLowerCase() ===
              String(customerName).replace(/\s+/g, "").toLowerCase()
        );

        console.log(existingRecord);
        if (!existingRecord) {
          invalidData.push(item);
          return {
            ...item,
            error: "Record not found in system", // Add the error field if a match is found
          }; // Return null for invalid items
        }

        // Step 5: Determine warranty months based on matching rules
        const matchingRules = rules.filter((rule) => {
          return (
            (rule.productCategory &&
              rule.productCategory === existingRecord.productCategory) ||
            (rule.countryIsoCode &&
              rule.countryIsoCode === existingRecord.countryCode) ||
            (rule.customer && rule.customer === existingRecord.customerName) ||
            (rule.product && rule.product === existingRecord.itemName)
          );
        });

        // Find the matched rule with the maximum warrantyMonth
        const matchedRule = matchingRules.reduce((maxRule, currentRule) => {
          const currentWarrantyMonth = parseInt(currentRule.warrantyMonth) || 0;
          const maxWarrantyMonth = parseInt(maxRule.warrantyMonth) || 0;
          return currentWarrantyMonth > maxWarrantyMonth
            ? currentRule
            : maxRule;
        }, matchingRules[0]);

        // Get the warranty month from the matched rule or use the default
        const warrantyMonths = matchedRule?.warrantyMonth
          ? parseInt(matchedRule.warrantyMonth)
          : defaultWarrantyMonth?.warrantyMonth
          ? parseInt(defaultWarrantyMonth.warrantyMonth)
          : 0;

        // Calculate the new expiry date based on invoice date and warranty months
        const oldExpiryDate = new Date(existingRecord.invoiceDate);
        oldExpiryDate.setMonth(oldExpiryDate.getMonth() + warrantyMonths);

        // Step 6: Calculate the month difference
        const monthDifference = dayjs(newExpiryDate).diff(
          dayjs(oldExpiryDate),
          "month"
        );

        // Return the update object for Prisma
        await prisma.productWarrantyDetails.updateMany({
          where: {
            serialNumber: String(serialNumber).trim(),
            companyId: envConfig.companyId,
            customerName: {
              equals: customerName.trim().toLowerCase(),
              mode: "insensitive", // Prisma-specific for case insensitivity
            },
            itemName: {
              equals: productName.trim().toLowerCase(),
              mode: "insensitive",
            },
          },
          data: {
            expiryDate: new Date(newExpiryDate),
            isExtendWarranty: true,
            extendedWarrantyMonths: monthDifference,
          },
        });

        return item;
      })
    );

    return updates;
  } catch (e) {
    console.log(e);
  }
  // Return the updated data (valid updates with errors if applicable)
};

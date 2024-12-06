import envConfig from "../../envConfig";
import { getAllWarrantyDetails } from "../repositories/productWarrantyDetailsRepository";
import getAllWarrantyDetailsRepo from "../repositories/warrantyRulesRepo";

class productWarrantyDetailsService {
  async getAllWarrantyDetails(
    pageNumber: number,
    pageSize: number,
    searchParams: { fields: string[]; value: string },
    companyId: string
  ) {
    // Fetch product warranty details from the repository with pagination and search params
    const warrantyDetails = await getAllWarrantyDetails(
      pageNumber,
      pageSize,
      searchParams
    );

    // Fetch all rules from the repository
    const rules = await getAllWarrantyDetailsRepo.getRules(String(companyId));

    // Fetch the default warranty month (from a separate Prisma query, assuming you have it)
    const defaultWarrantyMonth: any =
      await getAllWarrantyDetailsRepo.getDefaultMonth(envConfig.companyId);
    ``;
    // Iterate over each product warranty detail

    // Assuming `detail` is the object you're working with
    const productWarrantyDetails = await this.enrichWarrantyDetail(
      warrantyDetails.productWarrantyDetails,
      rules,
      defaultWarrantyMonth
    );

    return {
      productWarrantyDetails,
      totalRecords: warrantyDetails.totalRecords,
    };
  }

  async enrichWarrantyDetail(details, rules, defaultWarrantyMonth) {
    const enrichSingleDetail = async (detail) => {
      // Filter rules where any one condition matches
      const matchingRules = rules.filter((rule) => {
        return (
          (rule.productCategory &&
            rule.productCategory === detail.productCategory) ||
          (rule.countryIsoCode && rule.countryIsoCode === detail.countryCode) ||
          (rule.customer && rule.customer === detail.customerName) ||
          (rule.product && rule.product === detail.itemName)
        );
      });

      const filteredRules = matchingRules.filter(
        (rule) => new Date(detail.invoiceDate) >= new Date(rule.effectiveDate)
      );

      // Find the rule with the maximum warrantyMonth from the filtered rules
      const matchedRule = filteredRules.reduce((maxRule, currentRule) => {
        const currentWarrantyMonth = parseInt(currentRule.warrantyMonth) || 0;
        const maxWarrantyMonth = parseInt(maxRule.warrantyMonth) || 0;
        return currentWarrantyMonth > maxWarrantyMonth ? currentRule : maxRule;
      }, filteredRules[0] || null); // If no filtered rules, matchedRule will be null

      // Get the warranty month from the matched rule or use the default if no match
      const warrantyMonths = matchedRule?.warrantyMonth
        ? parseInt(matchedRule.warrantyMonth)
        : defaultWarrantyMonth?.warrantyMonth
        ? parseInt(defaultWarrantyMonth.warrantyMonth)
        : 0;

      let expiryDate;

      if (detail.isExtendWarranty) {
        // If already extended, add warranty months to existing expiry date
        expiryDate = new Date(detail.expiryDate);
        expiryDate.setMonth(expiryDate.getMonth());
      } else {
        // Otherwise, calculate expiry based on invoice date
        expiryDate = new Date(detail.invoiceDate);
        expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
      }

      const localExpiryDate = expiryDate.toLocaleDateString();

      // Check if the warranty has expired based on the current date
      const isExpired = new Date(localExpiryDate) < new Date();

      return {
        ...detail,
        warrantyMonths,
        expiryDate,
        isExpired,
        ruleName: matchedRule?.ruleName || "Default_Month", // Add ruleName from matched rule
      };
    };

    // Check if details is an array or an object
    if (Array.isArray(details)) {
      // If details is an array, map each detail to enrich it
      const enrichedArray = await Promise.all(details.map(enrichSingleDetail));
      return enrichedArray; // Return the enriched array
    } else if (typeof details === "object" && details !== null) {
      // If details is a single object, enrich it
      return await enrichSingleDetail(details); // Return the enriched object
    } else {
      throw new Error("Invalid input: details must be an object or an array");
    }
  }
}

export default new productWarrantyDetailsService();

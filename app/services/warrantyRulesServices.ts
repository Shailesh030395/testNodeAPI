import warrantyRulesRepo from "../repositories/warrantyRulesRepo";
import { CreateRuleRequestBody } from "../interfaces/global";
import envConfig from "../../envConfig";

class RuleService {
  // Create rule and call the repository
  // Create rule and call the repository
  async createRule(data: CreateRuleRequestBody, companyId: number) {
    //getuserId from the data based on companyid from

    return warrantyRulesRepo.createRule({
      companyId: envConfig.companyId,
      userId: Number(companyId), // Pass userId to the repository
      comments: data.comments, // Maps to the comments field in repo
      effectiveDate: data.effectiveDate,
      productCategory: data.productCategory,
      countryISOCode: data.countryISOCode,
      customer: data.customer,
      product: data.product,
      warrantyMonth: String(data.warrantyMonth),
    });
  }

  // Get all rules and call the repository
  async getAllRules(
    offset: number,
    limit: number,
    searchParams: { fields: string[]; value: string }
  ) {
    // Step 1: Fetch data from repository
    const data = await warrantyRulesRepo.getAllRules(
      offset,
      limit,
      searchParams
    );

    // Step 3: Return the filtered results and total records
    return {
      rules: data.rules, // All rules except 'DefaultMonth'
      totalRecords: data.totalCount, // Total number of records
    };
  }

  // Get a specific rule
  async getARule(id: number) {
    return warrantyRulesRepo.getARule(id);
  }

  // Get a specific rule
  async getDefaultMonth(id: string) {
    return warrantyRulesRepo.getDefaultMonth(id);
  }

  // Update a rule
  async updateRule(data: any) {
    return warrantyRulesRepo.updateRule(data);
  }

  upsertMonth = async (data: any, companyId: string) => {
    return await warrantyRulesRepo.upsertMonthByRuleName(data, companyId);
  };

  bulkAddRules = async (rulesData, companyId) => {
    return await warrantyRulesRepo.bulkAdd(rulesData, companyId);
  };

  // Delete a rule
  async deleteRule(ruleId: number) {
    return warrantyRulesRepo.deleteRule(ruleId);
  }
}

export default new RuleService();

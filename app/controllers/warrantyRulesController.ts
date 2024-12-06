import { Response, NextFunction } from "express";
import { DefaultResponse } from "../helper/defaultResponse";
import ruleServices from "../services/warrantyRulesServices";
import { RequestExtended } from "../interfaces/global";
import { CreateRuleRequestBody } from "../interfaces/global";
import envConfig from "../../envConfig";

class RulesController {
  // Create a single rule
  createRule = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const companyId = req.user.id;
      // Call the service method
      const body = req.body as CreateRuleRequestBody;

      // Call the service method with the extracted fields
      const createdRule = await ruleServices.createRule(body, companyId);
      return DefaultResponse(
        res,
        201,
        "Rule created successfully",
        createdRule
      );
    } catch (error) {
      console.log("error", error);
      next(error);
    }
  };

  // Get all rules
  getAllRules = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { pageNumber, pageSize, searchParams } = req.body;
      // Convert page and limit to numbers and ensure defaults if undefined or null
      const page = Number(pageNumber) || 1;
      const limitNumber = Number(pageSize) || 10;
      const offset = (page - 1) * limitNumber;

      const rules = await ruleServices.getAllRules(
        offset,
        Number(pageSize) || 10,
        searchParams || { fields: [], value: "" }
      );
      return DefaultResponse(res, 200, "Rules found successfully", rules);
    } catch (error) {
      next(error);
    }
  };

  // Get a single rule
  getARule = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const rule = await ruleServices.getARule(Number(id));

      return DefaultResponse(res, 200, "Rule found successfully", rule);
    } catch (error) {
      next(error);
    }
  };

  // Get a single rule
  getDefaultMonth = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    console.log("hello default month re", req);

    try {
      console.log("hello default month", req);

      const companyId = req.user.id;
      console.log("companyId", companyId);

      const defaultWarrantyMonths = await ruleServices.getDefaultMonth(
        envConfig.companyId
      );
      console.log("companyId", defaultWarrantyMonths);

      return DefaultResponse(
        res,
        200,
        "defaultWarrantyMonths found successfully",
        defaultWarrantyMonths
      );
    } catch (error) {
      next(error);
    }
  };

  updateRule = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Type assertion to extend req.body type
      const data = req.body as CreateRuleRequestBody;

      // Pass the validated data to the service method
      await ruleServices.updateRule(data);
      console.log("data", res);
      return DefaultResponse(res, 200, "Rule updated successfully");
    } catch (error) {
      next(error);
    }
  };

  upsertMonth = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const companyId = req.user.id;
      await ruleServices.upsertMonth(req.body, companyId);
      return DefaultResponse(
        res,
        201,
        "Default Month Rule updated successfully"
      );
    } catch (error) {
      console.log(error);

      next(error);
    }
  };

  bulkAddRules = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const companyId = req.user.id;

      const result = await ruleServices.bulkAddRules(req.body, companyId);
      return DefaultResponse(res, 201, "Rules added successfully");
    } catch (error) {
      console.log("error", error);
      next(error);
    }
  };

  // Delete a rule
  deleteRule = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { ruleId } = req.body;

      await ruleServices.deleteRule(ruleId);

      return DefaultResponse(res, 200, "Rule deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default new RulesController();

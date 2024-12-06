import { Request, Response, NextFunction } from "express";
import * as productWarrantyDetailsRepository from "../repositories/productWarrantyDetailsRepository";
import rulesRepository from "../repositories/warrantyRulesRepo";
import getAllWarrantyDetailsRepo from "../repositories/warrantyRulesRepo";

import productWarrantyDetailsService from "../services/productWarrantyDetailsService";

import { DefaultResponse } from "../helper/defaultResponse";
import { RequestExtended } from "../interfaces/global";
import envConfig from "../../envConfig";
import { invalid } from "moment-timezone";

class ProductWarrantyDetailsController {
  // Fetch product warranty details with pagination and filtering
  getAllWarrantyDetails = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    const { pageNumber, pageSize, searchParams } = req.body;
    const companyId = envConfig.companyId;
    try {
      const productWarrantyDetails =
        await productWarrantyDetailsService.getAllWarrantyDetails(
          pageNumber,
          pageSize,
          searchParams,
          companyId
        );

      return DefaultResponse(
        res,
        200,
        "Product warranty details found successfully",
        productWarrantyDetails
      );
    } catch (error) {
      next(error);
    }
  };

  // Fetch product warranty detail by serial number
  getBySerialNumber = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    const { serialNumber, ItemName } = req.body;
    const companyId = envConfig.companyId;
    try {
      const warrantyDetail =
        await productWarrantyDetailsRepository.getWarrantyDetailBySerialNumber(
          serialNumber,
          ItemName
        );

      if (!warrantyDetail) {
        return DefaultResponse(res, 404, "Warranty detail not found", null);
      }

      const rules = await rulesRepository.getRules(String(companyId));
      const defaultWarrantyMonth: any =
        await getAllWarrantyDetailsRepo.getDefaultMonth(envConfig.companyId);

      const enrichedWarrantyDetail =
        await productWarrantyDetailsService.enrichWarrantyDetail(
          warrantyDetail,
          rules,
          defaultWarrantyMonth
        );

      console.log(
        "enrichedWarrantyDetail_by_serialNumber",
        enrichedWarrantyDetail
      );

      return DefaultResponse(
        res,
        200,
        "Warranty detail found successfully",
        enrichedWarrantyDetail
      );
    } catch (error) {
      console.log("error", error);
      next(error);
    }
  };

  // Update the expiry date of a product warranty
  updateExpiryDate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id, expiryDate } = req.body;

    try {
      const updatedWarranty =
        await productWarrantyDetailsRepository.updateWarrantyExpiryDate(
          id,
          new Date(expiryDate)
        );

      return DefaultResponse(
        res,
        200,
        "Expiry date updated successfully",
        updatedWarranty
      );
    } catch (error) {
      next(error);
    }
  };

  extendWarrantyViaFile = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const warrantyData = req.body;
      // Assuming the file has been parsed into JSON with serialNumber, ProductName, and new expiryDate
      const companyId = req.user.id;

      // Iterate over the data and update each record
      // Find the product by serialNumber and productName, then update the expiry date
      const response =
        await productWarrantyDetailsRepository.updateWarrantyBySerialAndProduct(
          warrantyData,
          companyId
        );
      res.status(200).json({
        message: "Warranty dates extended successfully",
        invalidData: response,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ProductWarrantyDetailsController();

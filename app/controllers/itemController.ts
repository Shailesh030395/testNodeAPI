import { NextFunction, Response } from "express";
import { RequestExtended } from "../interfaces/global";
import { prisma } from "../config/conn";
import itemServices from "../services/itemServices";
import { DefaultResponse } from "../helper/defaultResponse";
import envConfig from "../../envConfig";

class ItemController {
  async getItems(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      const pageNumber = parseInt(req.query.pageNumber as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const fields = req.body.fields;
      const value = req.body.searchValue;
      const companyId = envConfig.companyId;

      const getItemsres = await itemServices.getItem(
        pageNumber,
        { fields, value },
        pageSize
      );

      return DefaultResponse(
        res,
        200,
        "Successfully fetched conenctions",
        getItemsres
      );
    } catch (error: any) {
      next(error);
    }
  }
}

export default new ItemController();

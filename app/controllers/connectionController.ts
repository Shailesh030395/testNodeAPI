import { NextFunction, Response } from "express";
import { RequestExtended } from "../interfaces/global";
import { prisma } from "../config/conn";
import connectionService from "../services/connectionService";
import { DefaultResponse } from "../helper/defaultResponse";

class ConnectionController {
  async getConnections(
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userID = req?.user?.id;
      const getConnectionRes = await connectionService.getConnectionByUser(
        userID
      );
      return DefaultResponse(
        res,
        200,
        "Successfully fetched conenctions",
        getConnectionRes
      );
    } catch (error: any) {
      next(error);
    }
  }

  async saveConnections(
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = req.body;
      const createConnRes = await connectionService.createConnection(
        data,
        req?.user?.id
      );

      return DefaultResponse(res, 200, "Connection created!", createConnRes);
    } catch (error: any) {
      next(error);
    }
  }

  async getqwcFile(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const getFileRes = await connectionService.downloadQwcFile(id);
      return DefaultResponse(res, 200, "Downloaded sucessfully!", getFileRes);
    } catch (error) {
      next(error);
    }
  }

  async deleteConnection(
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req?.params?.id;
      await connectionService.deleteConnection(id);
      return DefaultResponse(res, 200, "Connection deleted!");
    } catch (error: any) {
      next(error);
    }
  }
}

export default new ConnectionController();

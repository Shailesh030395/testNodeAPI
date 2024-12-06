import { error } from "console";
import { CustomError } from "../helper/customError";
import connectionRepo from "../repositories/connectionRepo";
import userServices from "./userServices";
import { prisma } from "../config/conn";
import xmlbuilder from "xmlbuilder";
import { randomUUID } from "crypto";

class ConnectionService {
  async getConnectionByUser(userId: number) {
    const getConnectionByUserRes = await connectionRepo.getConnectionsByUserId(
      userId
    );

    const connectionDetails = getConnectionByUserRes;
    if (!getConnectionByUserRes) {
      throw new CustomError(404, "User not found");
    }

    return connectionDetails;
  }

  async createConnection(userdata: any, userId: number) {
    const getUserRes = await userServices.getUser(userId);
    if (!getUserRes) {
      throw new CustomError(404, "User does not exist");
    }

    const createConnRes = await connectionRepo.createConnection(
      userdata,
      userId
    );

    return createConnRes;
  }

  async downloadQwcFile(id: any) {
    const companyResObj = await prisma.connections.findUnique({
      where: {
        companyId: id,
      },
    });

    if (!companyResObj || !companyResObj.tokenDetails) {
      throw new CustomError(404, "Company does not exist");
    }

    const { companyName, companyId } = JSON.parse(companyResObj?.tokenDetails);

    const qwcFileRes = await this.generateQWCFile({ companyName, companyId });

    return qwcFileRes;
  }

  async deleteConnection(connectionId: string) {
    await prisma.itemInventory.deleteMany({
      where: {
        companyId: connectionId,
      },
    });
    const deleteConnObj = await connectionRepo.deleteConnection(connectionId);
    return deleteConnObj;
  }

  async generateQWCFile({
    companyName,
    companyId,
  }: {
    companyName: string;
    companyId: string;
  }) {
    const qwcData = {
      AppName: companyName,
      AppID: companyName,
      AppURL: `${process.env.QB_SOAP_BASEURL}/3nStar/qbd?wsdl`,
      AppDescription: "Sync Inventory Items Service",
      AppSupport: `${process.env.QB_SOAP_BASEURL}/Satva/qbd?wsdl`,
      UserName: companyName,
      OwnerID: `{${randomUUID()}}`,
      FileID: `{${randomUUID()}}`,
      QBType: "QBFS",
      Style: "Document",
      AuthFlags: "0xF",
      Scheduler: {
        RunEveryNMinutes: 30,
      },
    };

    const qwcXML = xmlbuilder
      .create("QBWCXML")
      .ele(qwcData)
      .end({ pretty: true });

    console.log("qwcXML: ", qwcXML);
    return qwcXML;
  }
}

export default new ConnectionService();

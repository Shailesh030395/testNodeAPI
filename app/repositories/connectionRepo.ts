import envConfig from "../../envConfig";
import { prisma } from "../config/conn";
import { hashPassword } from "../helper/passwordHelper";

class ConnectionRepo {
  async getConnectionsByUserId(id: number) {
    const getConnectionByUserRes = await prisma.connections.findMany({
      select: {
        companyName: true,
        companyId: true,
        status: true,
        userId: true,
        isActiveConnection: true,
      },
    });

    return getConnectionByUserRes;
  }

  async createConnection(connectionData: any, userId: number) {
    const { companyName, tenantId, password } = connectionData;
    const hashedPassword = await hashPassword(connectionData.password);
    const createConnRes = await prisma.connections.create({
      data: {
        tokenDetails: JSON.stringify({
          companyName: "3nStar",
          tenantId: tenantId,
          password: hashedPassword,
        }),
        isActiveConnection: false,
        userId: userId,
        companyName: "3nStar",
        companyId: envConfig.companyId,
        createdBy: userId.toString(),
        modifiedBy: userId.toString(),
        status: "Pending",
      },
    });

    return createConnRes;
  }

  async deleteConnection(id: string) {
    const deleteConnRes = await prisma.connections.delete({
      where: {
        companyId: id,
      },
    });
    return deleteConnRes;
  }
}

export default new ConnectionRepo();

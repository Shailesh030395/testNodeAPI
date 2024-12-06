import { prisma } from "../config/conn";
import { UserInfo } from "../interfaces/global";

class UserRepo {
  async fetchUserById(id: number) {
    const userRes = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        companyRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                roleName: true,
              },
            },
          },
        },
        firstName: true,
        lastName: true,
        email: true,
        status: true,
      },
    });

    return userRes;
  }

  async getAll(
    company: string,
    offset?: number,
    limit?: number,
    filterConditions?: any,
    searchCondition?: any,
    sortCondition?: any
  ) {
    const sortPosition = sortCondition?.orderBy?.firstName || "asc";
    try {
      const users = await prisma.companyRole.findMany({
        where: {
          user: {
            AND: [filterConditions ?? {}, searchCondition ?? {}],
          },
          companyId: company,
        },
        orderBy: {
          user: {
            firstName: sortPosition || "asc",
          },
        },
        include: {
          role: true,
          user: true,
        },
        skip: offset,
        take: limit,
      });

      return users;
    } catch (err) {
      throw err;
    }
  }

  // Get total count
  async count(company: string, filterConditions: any, searchCondition: any) {
    try {
      const total = await prisma.companyRole.count({
        where: {
          ...filterConditions,
          user: { ...searchCondition },
          companyId: company,
        },
      });
      return total;
    } catch (err) {
      throw err;
    }
  }

  async getById(id: any) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: id,
        },
        include: {
          connections: {
            select: {
              companyId: true,
              id: true,
              companyName: true,
              isActiveConnection: true,
            },
          },
          companyRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      return user;
    } catch (err) {
      throw err;
    }
  }

  //  Create a new user
  async create(userData: UserInfo) {
    try {
      const user = await prisma.user.create({
        data: userData,
      });
      return user;
    } catch (err) {
      throw err;
    }
  }
}

export default new UserRepo();

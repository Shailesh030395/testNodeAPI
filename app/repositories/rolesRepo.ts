import { prisma } from "../config/conn";

// type SortCondition = {
// 	orderBy: {
// 		[key: string]: 'asc' | 'desc';
// 	};
// };
class RoleRepositories {
  async getDetails(id: string) {
    try {
      const role = await prisma.role.findFirst({
        where: {
          id: id,
        },
      });
      return role;
    } catch (err) {
      throw err;
    }
  }
  //   async checkCompanyAndRole(roleId: string, companyId: string) {
  //     try {
  //       const isValid = await prisma.company.findFirst({
  //         where: {
  //           id: companyId,
  //           users: {
  //             some: {
  //               roleId: roleId,
  //             },
  //           },
  //         },
  //       });

  //       return isValid;
  //     } catch (err) {
  //       throw err;
  //     }
  //   }

  // /
  async isSameNameRole(companyId: string, roleName: string, roleId = "") {
    try {
      const isExistingRole = await prisma.role.findFirst({
        where: {
          id: {
            not: roleId,
          },
          roleName: {
            mode: "insensitive",
            equals: roleName,
          },
        },
      });

      if (isExistingRole) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw error;
    }
  }

  // For create the role
  createRole = async (
    roleName: string,
    roleDescription: string,
    isAdminRole: boolean = false,
    isCompanyAdmin: boolean = false
  ) => {
    try {
      const role = await prisma.role.create({
        data: {
          roleName,
          roleDescription,
          isAdminRole,
          isCompanyAdmin,
        },
      });

      return role;
    } catch (error) {
      throw error;
    }
  };

  //   combineRoleCompany = async (companyId: string, roleId: string) => {
  //     const companyRole = await prisma.companyRole.create({
  //       data: {
  //         company: { connect: { id: companyId } },
  //         role: { connect: { id: roleId } },
  //       },
  //     });
  //     return companyRole;
  //   };

  // Check ROle By Name
  checkAdmin = async (roleName: string) => {
    try {
      const role = await prisma.role.findFirst({
        where: {
          roleName: {
            equals: roleName,
            mode: "insensitive",
          },
        },
      });

      return role;
    } catch (err) {
      throw err;
    }
  };

  // For get all the roles of some organization
  getAllRole = async () => {
    try {
      const roles = await prisma.role.findMany({
        orderBy: {
          roleName: "asc",
        },
      });
      return roles;
    } catch (error) {
      throw error;
    }
  };

  // For update the role
  updateRole = async (roleId: string, data: any) => {
    try {
      // Update the role
      await prisma.role.update({
        where: {
          id: roleId,
        },
        data,
      });

      if ("status" in data) {
        // Get the new status value from the data object
        const { status } = data;

        // Find all associated users for the role
        const associatedUsers = await prisma.companyRole.findMany({
          where: {
            roleId,
          },
          select: {
            userId: true,
          },
        });

        // Extract the userIds from the associated users
        const userIds = associatedUsers.map(
          (companyRole) => companyRole.userId
        );

        // Update the status of associated users
        await prisma.user.updateMany({
          where: {
            id: {
              in: userIds,
            },
          },
          data: {
            status,
          },
        });
      }
    } catch (error) {
      throw error;
    }
  };

  // For delete the role from company role table
  deleteCompanyRole = async (id: string) => {
    try {
      await prisma.companyRole.deleteMany({
        where: {
          roleId: id,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  // For delete the role from role table
  deleteRole = async (id: string) => {
    try {
      await prisma.role.deleteMany({
        where: {
          id,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  // Check if user exist in the company
  async userExist(userId: number, companyId: string) {
    try {
      const user = await prisma.companyRole.findMany({
        where: {
          userId: userId,
          companyId: companyId,
        },
      });
      return user;
    } catch (err) {
      throw err;
    }
  }

  // Check company admin role by id
  async checkCompanyAdminRole(roleId: string) {
    try {
      const isCompanyAdmin = await prisma.role.findUnique({
        where: {
          id: roleId,
        },
      });
      return isCompanyAdmin;
    } catch (err) {
      throw err;
    }
  }
}

export default new RoleRepositories();

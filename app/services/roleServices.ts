import { prisma } from "../config/conn";
import { CustomError } from "../helper/customError";
import roleRepository from "../repositories/rolesRepo";

class RoleService {
  // Get all roles
  getAllRoles = async () => {
    try {
      // Get all roles
      const roles = await roleRepository.getAllRole();

      return { roles };
    } catch (err) {
      // Handle and propagate the error
      throw err;
    }
  };

  // For creating a role
  createRole = async ({
    isAdminRole = false,
    roleName,
    roleDescription,
    orgId,
    isCompanyRole = false,
  }: {
    isAdminRole?: boolean;
    roleName: string;
    roleDescription: string;
    orgId: string;
    isCompanyRole?: boolean;
  }) => {
    try {
      // Check if there's another role with the same name in the organization
      const isSameNameRole = await roleRepository.isSameNameRole(
        orgId,
        roleName
      );

      if (isSameNameRole) {
        // Role with the same name already exists
        throw new CustomError(400, "Role already exists with the same name");
      } else {
        // Create the role
        const role = await roleRepository.createRole(
          roleName,
          roleDescription,
          isAdminRole,
          isCompanyRole
        );

        return role;
      }
    } catch (error) {
      // Handle and propagate the error
      throw error;
    }
  };

  // For updating the role
  updateUserRole = async (finalData: any) => {
    const { roleId, orgId, ...data }: any = finalData;
    try {
      // Get the role details by roleId
      const role = await roleRepository.getDetails(roleId);

      if (data?.roleName) {
        // Check if there's another role with the same name in the organization
        const isSameNameRole = await roleRepository.isSameNameRole(
          orgId!,
          data?.roleName,
          roleId
        );
        if (isSameNameRole) {
          throw new CustomError(400, "Role already exists with the same name");
        }
      }

      if (role) {
        if (!(role.isAdminRole || role.isCompanyAdmin)) {
          const updateRole = await roleRepository.updateRole(roleId, data);
          return updateRole;
        } else {
          throw new CustomError(403, "You cannot update the admin role");
        }
      } else {
        throw new CustomError(404, "No role found");
      }
    } catch (error) {
      throw error;
    }
  };

  // For deleting  the role
  deleteRole = async (roleId: string) => {
    try {
      // Get the role details by roleId
      const role = await roleRepository.getDetails(roleId);

      // Check if there are users associated with this role
      const isUsersInRole = await prisma.companyRole.findMany({
        where: {
          roleId,
        },
      });

      if (isUsersInRole.length > 0) {
        // Users are associated with this role, cannot delete it
        throw new CustomError(
          403,
          "Please delete or update the roles of associated users first"
        );
      }

      if (role) {
        if (!(role.isAdminRole || role.isCompanyAdmin)) {
          await prisma.companyRole.deleteMany({
            where: {
              roleId,
            },
          });

          // Delete the role
          await prisma.role.delete({
            where: {
              id: roleId,
            },
          });
        } else {
          // Attempting to delete an admin role
          throw new CustomError(403, "You cannot delete the admin role");
        }
      } else {
        // Role not found
        throw new CustomError(404, "No role found");
      }
    } catch (error) {
      // Handle and propagate the error
      throw error;
    }
  };
}

export default new RoleService();

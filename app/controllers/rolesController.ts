import { prisma } from "./../config/conn";
import { Response, NextFunction } from "express";
import rolesRepo from "../repositories/rolesRepo";
import { DefaultResponse } from "../helper/defaultResponse";
import roleServices from "../services/roleServices";
import { CustomError } from "../helper/customError";
import { RequestExtended } from "../interfaces/global";
import envConfig from "../../envConfig";
class RolesController {
  // Create a single role
  createRole = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Validate the request body
      const orgId = req.user.companyId;
      const { roleDescription, roleName, isAdminRole = false } = req.body;
      // Call the createRole method from roleService to create the role
      const createdRole = await roleServices.createRole({
        orgId,
        roleDescription,
        roleName,
        isAdminRole,
      });

      // Respond with the created role and a success message (HTTP 201 Created)
      return DefaultResponse(
        res,
        201,
        "Role created successfully",
        createdRole
      );
    } catch (error) {
      // Handle errors and pass them to the next middleware (HTTP 500 Internal Server Error)
      next(error);
    }
  };

  // Get all roles from a company
  getAllRoles = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { page = 1, limit = 10, search, filter, type, sort } = req.query;

      // Call the getAllRoles method from roleService to fetch roles
      const roles = await roleServices.getAllRoles();

      return DefaultResponse(res, 200, "Roles found successfully", roles);
    } catch (error) {
      // Handle errors and pass them to the next middleware (HTTP 500 Internal Server Error)
      next(error);
    }
  };

  // Get a single role from a company
  getARole = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      // Call the getDetails method from roleRepository to fetch a single role
      const role = await prisma.role.findUnique({
        where: {
          id,
        },
        select: {
          roleName: true,
          isAdminRole: true,
          isCompanyAdmin: true,
        },
      });

      // Respond with the fetched role and a success message (HTTP 200 OK)
      return DefaultResponse(res, 200, "Role found successfully", role);
    } catch (error) {
      // Handle errors and pass them to the next middleware (HTTP 500 Internal Server Error)
      next(error);
    }
  };

  // Update a role
  updateRole = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = req.body;

      // eslint-disable-next-line no-prototype-builtins
      if (!data.hasOwnProperty("status")) {
        if (data?.roleName.trim() === "") {
          return DefaultResponse(res, 400, "Please enter the role name");
        }
        if (data?.roleDescription.trim() === "") {
          return DefaultResponse(res, 400, "Please enter the role description");
        }
      }

      // Call the updateUserRole method from roleService to update the role
      await roleServices.updateUserRole(data);

      // Respond with a success message (HTTP 200 OK)
      return DefaultResponse(res, 200, "Role updated successfully");
    } catch (error) {
      // Handle errors and pass them to the next middleware (HTTP 500 Internal Server Error)
      next(error);
    }
  };

  // Delete a role
  deleteRole = async (
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Validate the request body
      //   checkValidation(req);
      const { roleId } = req.body;

      // Check if the user has permission to delete roles
      //   const isPermitted = await checkPermission(req, {
      //     permissionName: "Roles",
      //     permission: ["delete"],
      //   });

      //   if (!isPermitted) {
      //     // If not authorized, throw a custom error (HTTP 403 Forbidden)
      //     throw new CustomError(403, "You are not authorized");
      //   }

      // Call the deleteRole method from roleService to delete the role
      await roleServices.deleteRole(roleId);

      // Respond with a success message (HTTP 200 OK)
      return DefaultResponse(res, 200, "Role deleted successfully");
    } catch (error) {
      // Handle errors and pass them to the next middleware (HTTP 500 Internal Server Error)
      next(error);
    }
  };
}

export default new RolesController();

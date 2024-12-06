import { NextFunction, Response } from "express";
import { DefaultResponse } from "../helper/defaultResponse";
import { RequestExtended } from "../interfaces/global";
import userServices from "../services/userServices";
import { UserInfo } from "../interfaces/global";
import userRepo from "../repositories/userRepo";
import { hashPassword } from "../helper/passwordHelper";
import envConfig from "../../envConfig";

class UserController {
  async getAllUsers(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      // console.log('req: ', req);

      const { page = 1, limit = 10, search, filter, type, sort } = req.query;

      // Call userServices to fetch users based on the provided parameters
      const { users, total } = await userServices.getAllUsers(
        req.user.id,
        envConfig.companyId as string,
        Number(page),
        Number(limit),
        search as string,
        filter as string,
        type as string,
        sort as string
      );

      // Return a successful response with HTTP 200 status code, user data, and pagination information
      return DefaultResponse(
        res,
        200,
        "Users fetched successfully",
        users,
        total,
        Number(page)
      );
    } catch (err) {
      // Handle any errors that occur during the execution
      next(err);
    }
  }

  async getUserDetails(
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id;

      // Call the userServices function to fetch user details by user ID
      const user = await userServices.getUserById(id);

      // Check if the user exists
      if (!user) {
        // Return an HTTP 404 status code with a friendly message if the user is not found
        return DefaultResponse(
          res,
          404,
          "User not found. Please check the user ID and try again."
        );
      }

      // Return a successful response with HTTP 200 status code and user details
      return DefaultResponse(
        res,
        200,
        "User details fetched successfully",
        user
      );
    } catch (err) {
      // Handle any errors that occur during the execution
      next(err);
    }
  }

  async createUser(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      // Hashing the user's password for security
      const { password } = req.body;
      const hashedPassword = await hashPassword(password);

      // Constructing user data
      const userData: UserInfo = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        password: hashedPassword,
      };

      // Calling userRepository to create the user
      const user = await userRepo.create(userData);

      // Returning a successful response with HTTP 200 status code
      return DefaultResponse(res, 200, "User created successfully", user);
    } catch (err) {
      // Handling any errors that occur during the execution
      next(err);
    }
  }

  async updateUser(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      const dataToupdateUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        roleId: req.body.roleId,
        status: req.body.status,
        companyId: envConfig.companyId,
        userId: req.body.userId,
      };

      const user = await userServices.updateUser(dataToupdateUser);

      return DefaultResponse(res, 200, "User updated successfully", user);
    } catch (err) {
      next(err);
    }
  }

  // Deleting a user
  async deleteUser(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      const company = envConfig.companyId;
      const { user } = req.body;

      // Delete the user using userServices
      const deletedUser = await userServices.deleteUser(user, company);

      // Return a successful response with HTTP 200 status code
      return DefaultResponse(
        res,
        200,
        "User deleted successfully",
        deletedUser
      );
    } catch (err) {
      // Handle any errors that occur during the execution
      next(err);
    }
  }

  // Inviting a user
  async inviteUser(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      // Check Validation of the request
      const { email, role, phone, firstName = "", lastName = "" } = req.body;

      // Invite the user using userServices
      const user = await userServices.inviteUser(
        req.user.id,
        email,
        role,
        req.user.companyId,
        phone,
        firstName,
        lastName
      );

      // Return a successful response with HTTP 200 status code
      return DefaultResponse(res, 200, "User invited successfully", user);
    } catch (err) {
      console.log("inviteuser", err);
      // Handle any errors that occur during the execution
      next(err);
    }
  }
}
export default new UserController();

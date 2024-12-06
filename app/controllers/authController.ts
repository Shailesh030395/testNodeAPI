import { NextFunction, Response } from "express";
import { RequestExtended } from "../interfaces/global";
import authServices from "../services/authServices";
import { DefaultResponse } from "../helper/defaultResponse";
import userServices from "../services/userServices";
import { hashPassword } from "../helper/passwordHelper";
import { CustomError } from "../helper/customError";

class AuthController {
  async login(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      const fetchUserRes = await authServices.login(username, password);

      return DefaultResponse(
        res,
        200,
        "User logged in successfully",
        fetchUserRes
      );
    } catch (error: any) {
      next(error);
    }
  }

  // Change Password
  async changePassword(
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Extract password and token from the request
      const { password } = req.body;
      const { token } = req.params;

      // Change the user's password using the provided token
      const user = await authServices.changePassword(token, password);

      // Respond with a success message and user data
      return DefaultResponse(
        res,
        200,
        "User password changed successfully",
        user
      );
    } catch (err) {
      // Handle errors and pass them to the next middleware
      next(err);
    }
  }

  async getProfile(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      const userId = Number(req?.user?.id);
      const getProfileRes = await userServices.getUser(userId);

      return DefaultResponse(
        res,
        200,
        "Profile fetched successfully",
        getProfileRes
      );
    } catch (error) {
      next(error);
    }
  }

  async GetPassword(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      // Extract password and token from the request
      const { password } = req.body;
      const { token } = req.params;

      // Get the user's password using the provided token
      const user = await authServices.GetPassword(token);

      // Respond with a success message and user data
      return DefaultResponse(
        res,
        200,
        "User password retrieved successfully",
        user
      );
    } catch (err) {
      // Handle errors and pass them to the next middleware
      next(err);
    }
  }

  // Set Password
  async SetPassword(req: RequestExtended, res: Response, next: NextFunction) {
    try {
      // Extract password and token from the request
      const { password } = req.body;
      const { token } = req.params;

      // Set the user's password using the provided token
      const user = await authServices.setPassword(token, password);

      // Respond with a success message and user data
      return DefaultResponse(res, 200, "User password set successfully", user);
    } catch (err) {
      // Handle errors and pass them to the next middleware
      next(err);
    }
  }

  // Forgot Password
  async forgotPassword(
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Extract the email from the request body
      const { email } = req.body;

      // Trigger the forgot password process
      await authServices.forgotPassword(email);

      // Respond with a success message
      return DefaultResponse(
        res,
        200,
        "Password reset link sent to your email address"
      );
    } catch (err) {
      // Handle errors and pass them to the next middleware
      next(err);
    }
  }

  // Verify Forgot Password Token
  async verifyForgotPasswordToken(
    req: RequestExtended,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Extract the token from the query parameters
      const { token } = req.query;

      // Verify the forgot password token
      await authServices.verifyForgotPassword(token as string);

      // Respond with a success message
      return DefaultResponse(
        res,
        200,
        "Reset Password Token verified successfully"
      );
    } catch (err) {
      // Handle errors and pass them to the next middleware
      next(err);
    }
  }
}

export default new AuthController();

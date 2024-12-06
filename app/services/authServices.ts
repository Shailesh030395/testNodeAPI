import envConfig from "../../envConfig";
import { prisma } from "../config/conn";
import { CustomError } from "../helper/customError";
import sendEmail from "../helper/emailHelper";
import { getForgotPasswordTemplate } from "../helper/emailTemplateHelper";
import { comparePassword, hashPassword } from "../helper/passwordHelper";
import {
  generateAccessToken,
  generateForgotPasswordToken,
  verifyAccessToken,
  verifyForgotPasswordToken,
} from "../helper/tokenHelper";
import authRepo from "../repositories/authRepo";
import userRepo from "../repositories/userRepo";

class AuthServices {
  async login(email: string, password: string) {
    const userRes = await authRepo.fetchUser(email);
    if (!userRes) {
      throw new CustomError(404, "User does not exist"); // 404 Not Found - The user with the given email does not exist.
    }

    if (!userRes.status) {
      throw new CustomError(400, "User is not active"); // 404 Not Found - The user with the given email does not exist.
    }

    if (!userRes.companyRoles[0].role.status) {
      throw new CustomError(400, "User not active");
    }

    const isPasswordValid = await comparePassword(password, userRes.password!);

    if (!isPasswordValid) {
      throw new CustomError(401, "Invalid credentials");
    }

    const generateTokenRes = await generateAccessToken({
      id: userRes?.id,
      email,
    });

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        token: generateTokenRes,
      },
    });

    return generateTokenRes;
  }

  // async verifyForgotPassword(token: string) {
  //   // If token does not exist, send a 400 Bad Request error
  //   if (!token) {
  //     const err = new CustomError(400, "Token missing");
  //     throw err;
  //   }

  //   const verified: any = verifyForgotPasswordToken(token);

  //   // If the token is not valid, send a 401 Unauthorized error
  //   if (!verified) {
  //     const err = new CustomError(401, "Invalid token");
  //     throw err;
  //   }

  //   // Find the user by email from the verified token
  //   const user = await userRepository.getByEmail(verified?.email as string);

  //   // If the user does not exist, send a 404 Not Found error
  //   if (!user) {
  //     const err = new CustomError(404, "User not found");
  //     throw err;
  //   }

  //   // If the forgotPasswordToken does not match the token in the database, send a 401 Unauthorized error
  //   if (user.forgotPasswordToken !== token) {
  //     const err = new CustomError(401, "Reset token has expired");
  //     throw err;
  //   }

  //   // Everything is valid, proceed further
  //   return true;
  // }

  async changePassword(token: string, password: string) {
    // If token is missing, send a 400 Bad Request error
    if (!token) {
      const err = new CustomError(400, "Token missing"); // 400 Bad Request
      throw err;
    }

    const verified: any = await verifyForgotPasswordToken(token);

    // If the token is invalid, send a 401 Unauthorized error
    if (!verified) {
      const err = new CustomError(401, "Invalid token"); // 401 Unauthorized
      throw err;
    }

    // Find user by email from the verified token
    const user = await prisma.user.findUnique({
      where: {
        email: verified?.email,
      },
    });

    // If the user does not exist, send a 404 Not Found error
    if (!user) {
      const err = new CustomError(404, "User not found"); // 404 Not Found
      throw err;
    }

    // If the provided token doesn't match the one in the user's record, send a 401 Unauthorized error
    if (user.forgotPasswordToken !== token) {
      const err = new CustomError(401, "Reset token has expired"); // 401 Unauthorized
      throw err;
    }

    // Check if the new password is the same as the old one
    if (user?.password) {
      const encrypted = await comparePassword(password, user?.password);

      // If the new password is the same as the old one, send a 422 Unprocessable Entity error
      if (encrypted) {
        const error = new CustomError(
          422,
          "New password cannot be the same as the old password"
        ); // 422 Unprocessable Entity
        throw error;
      }
    }

    // Encrypt the new password
    const hashedPassword = await hashPassword(password);

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        isVerified: true,
        forgotPasswordToken: null,
        // forgotPasswordTokenExpiresAt: null,
      },
    });

    return updatedUser;
  }

  async GetPassword(token: string) {
    // If token is missing, send a 400 Bad Request error
    if (!token) {
      const err = new CustomError(400, "Token missing"); // 400 Bad Request
      throw err;
    }

    const verified: any = await verifyAccessToken(token);

    // If the token is invalid, send a 401 Unauthorized error
    if (!verified) {
      const err = new CustomError(401, "Invalid token"); // 401 Unauthorized
      throw err;
    }

    // Find user by email from the verified token
    const user = await prisma.user.findUnique({
      where: {
        email: verified?.email,
      },
    });

    // If the user does not exist, send a 404 Not Found error
    if (!user) {
      const err = new CustomError(404, "User not found"); // 404 Not Found
      throw err;
    }

    // Return the user information
    return user;
  }

  async setPassword(token: string, password: string) {
    // If token is missing, send a 400 Bad Request error
    if (!token) {
      const err = new CustomError(400, "Token missing"); // 400 Bad Request
      throw err;
    }

    const verified: any = await verifyAccessToken(token);

    // If the token is invalid, send a 401 Unauthorized error
    if (!verified) {
      const err = new CustomError(401, "Invalid token"); // 401 Unauthorized
      throw err;
    }

    // Find user by email from verified token
    const user = await prisma.user.findUnique({
      where: {
        email: verified?.email,
      },
    });
    // If the user does not exist, send a 404 Not Found error
    if (!user) {
      const err = new CustomError(404, "User not found"); // 404 Not Found
      throw err;
    }

    // Check if the new password is the same as the old one
    if (user?.password) {
      const encrypted = await comparePassword(password, user?.password);

      // If the new password is the same as the old one, send a 422 Unprocessable Entity error
      if (encrypted) {
        const error = new CustomError(
          422,
          "New password cannot be the same as the old password"
        ); // 422 Unprocessable Entity
        throw error;
      }
    }

    // Encrypt the new password
    const hashedPassword = await hashPassword(password);

    const updatedUser = await prisma.user.update({
      where: { id: user?.id },
      data: {
        password: hashedPassword,
        isVerified: true,
        status: true,
      },
    });
    return updatedUser;
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      // 404 Not Found - User not found, but returning a custom message as there's no direct HTTP response here.
      const error = new CustomError(404, "User does not exist");
      throw error;
    }

    // Generate forgot password token
    const forgotPasswordToken = await generateForgotPasswordToken({
      id: user?.id,
      email: email,
    });

    // Expires in 1 hour
    const forgotPasswordTokenExpiresAt: string = (
      Date.now() + envConfig.forgotPasswordUrlExpireTime
    ).toString();

    await prisma.user.update({
      where: {
        id: user?.id,
      },
      data: {
        forgotPasswordToken: forgotPasswordToken,
      },
    });

    const fullName =
      user?.firstName || user?.lastName
        ? user?.firstName + " " + user?.lastName
        : "User";

    // Generate a URL with the reset token and expiration time
    const url = `${envConfig?.resetPasswordReactUrl}?token=${forgotPasswordToken}&exp=${forgotPasswordTokenExpiresAt}`;

    // Compose email content for the password reset email
    const emailContent = getForgotPasswordTemplate({
      fullName,
      url,
    });

    // Send the email with the reset token
    const mailOptions = {
      from: envConfig.smtpEmail,
      to: email,
      subject: "Reset Password - 3nStar",
      html: emailContent,
      attachments: [],
    };

    await sendEmail(mailOptions);
  }

  async verifyForgotPassword(token: string) {
    // If token does not exist, send a 400 Bad Request error
    if (!token) {
      const err = new CustomError(400, "Token missing");
      throw err;
    }

    const verified: any = verifyForgotPasswordToken(token);

    // If the token is not valid, send a 401 Unauthorized error
    if (!verified) {
      const err = new CustomError(401, "Invalid token");
      throw err;
    }

    // Find the user by email from the verified token
    const user = await prisma.user.findUnique({
      where: {
        email: verified?.email as string,
      },
    });

    // If the user does not exist, send a 404 Not Found error
    if (!user) {
      const err = new CustomError(404, "User not found");
      throw err;
    }

    // If the forgotPasswordToken does not match the token in the database, send a 401 Unauthorized error
    if (user.forgotPasswordToken !== token) {
      const err = new CustomError(401, "Reset token has expired");
      throw err;
    }

    // Everything is valid, proceed further
    return true;
  }
}

export default new AuthServices();

import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
import dotenv from "dotenv";
import { CustomError } from "../helper/customError";
import { verifyAccessToken } from "../helper/tokenHelper";
import { prisma } from "../config/conn";
dotenv.config({ path: ".env" });

export const authCheck = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req?.headers?.authorization?.split(" ")[1];

  if (!accessToken?.trim() || accessToken.trim() === "") {
    const error = new CustomError(
      401,
      "Authentication Error: Your session has expired. Please log in again to continue using the app."
    );
    return next(error);
  }

  // Verify the access token
  const verifyAccessTokenRes: any = verifyAccessToken(accessToken);

  if (!verifyAccessTokenRes) {
    const error = new CustomError(
      401,
      "Authentication Error: Invalid access token,please login again"
    );
    return next(error);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: verifyAccessTokenRes.email,
    },
  });

  if (user?.status === false) {
    const error = new CustomError(400, "Authentication Error: user not active");
    return next(error);
  }

  req.user = {
    ...verifyAccessTokenRes,
    id: user.id,
  };

  next();
};

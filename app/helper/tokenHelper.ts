import envConfig from "../../envConfig";
import jwt from "jsonwebtoken";

// Verify Access Token
export const verifyAccessToken = (accessToken: string) => {
  let verified;
  try {
    verified = jwt.verify(accessToken, envConfig.accessTokenSecretKey);
  } catch (err) {
    console.log(err);
    verified = false;
  }
  return verified;
};

// Generate AccessToken
export const generateAccessToken = (payload: any) => {
  // expiresIn works in seconds if given in number
  const token = jwt.sign(payload, envConfig.accessTokenSecretKey, {
    expiresIn: envConfig.accessTokenExpireTime,
  });
  return token;
};

// Verify Forgot Password Token
export const verifyForgotPasswordToken = (forgotPasswordToken: any) => {
  const verified = jwt.verify(
    forgotPasswordToken,
    envConfig.forgotPasswordTokenSecretKey
  );
  return verified;
};

// Generate Forgot Password Token
export const generateForgotPasswordToken = (payload: any) => {
  const token = jwt.sign(payload, envConfig.forgotPasswordTokenSecretKey);
  return token;
};



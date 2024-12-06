import express from "express";
import { loginValidationRules } from "../helper/validator";
import authController from "../controllers/authController";
import { authCheck } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/login", loginValidationRules, authController.login);
router.get("/profile", authCheck, authController.getProfile);

router.get("/getpassword/:token", authController.GetPassword);

router.post(
  "/change-password/:token",
  authController.changePassword
);

router.post(
  "/forgot-password",
  authController.forgotPassword
);

router.post(
  "/verify-forgot-password",
  authController.verifyForgotPasswordToken
);

// Change Password
router.post("/set-password/:token", authController.SetPassword);

export default router;

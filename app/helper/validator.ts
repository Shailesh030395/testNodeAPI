import { body } from "express-validator";

// Login validation rules
export const loginValidationRules = [
  body("email").isEmail().withMessage("Invalid email address"),

  body("password").notEmpty().withMessage("Password is required"),
]; 

export const createConnectionRules = [
  body("companyName").notEmpty().withMessage("Company name is required"),
  body("tenantId").notEmpty().withMessage("Tenant id is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

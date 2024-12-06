import { Router } from "express";
import productWarrantyDetailsController from "../controllers/productWarrantyDetailsController";
import { authCheck } from "../middleware/authMiddleware";

const productWarrantyDetailsRoutes = Router();

// GET: Fetch product warranty details with pagination and filter
productWarrantyDetailsRoutes.post(
  "/",
  authCheck,
  productWarrantyDetailsController.getAllWarrantyDetails
);

// GET: Fetch product warranty detail by serial number
productWarrantyDetailsRoutes.post(
  "/check-warranty",
  productWarrantyDetailsController.getBySerialNumber
);

productWarrantyDetailsRoutes.post(
  "/extend-warranty-via-file",
  authCheck,
  productWarrantyDetailsController.extendWarrantyViaFile
);

// PUT: Update the expiry date of a product warranty
productWarrantyDetailsRoutes.put(
  "/update-expiry-date",
  authCheck,
  productWarrantyDetailsController.updateExpiryDate
);

export default productWarrantyDetailsRoutes;

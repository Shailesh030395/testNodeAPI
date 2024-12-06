import express from "express";
import authRoutes from "./authRoutes";
import connectionRoutes from "./connectionRoutes";
import itemRoutes from "./itemRoutes";
import userRoutes from "./userRoutes";
import roleRoutes from "./roleRoutes";
import warrantyRulesRoutes from "./warrantyRulesRoutes";
import productWarrantyDetailsRoutes from "./productWarrantyDetailsRoutes";

import { customError, notFound } from "../helper/errorHandler";

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/connection", connectionRoutes);
router.use("/users", userRoutes);
router.use("/items", itemRoutes);
router.use("/role", roleRoutes);
router.use("/warranty-rules", warrantyRulesRoutes);
router.use("/productWarrantyDetails", productWarrantyDetailsRoutes);

router.use(notFound);
router.use(customError);

export default router;

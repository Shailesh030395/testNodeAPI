import express from "express";
import itemController from "../controllers/itemController";
import { authCheck } from "../middleware/authMiddleware";

const router = express.Router();
router.post("/getItems", authCheck, itemController.getItems);
export default router;

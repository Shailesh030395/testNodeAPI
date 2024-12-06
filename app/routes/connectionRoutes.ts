import express from "express";
import connectionController from "../controllers/connectionController";
import { authCheck } from "../middleware/authMiddleware";
import { createConnectionRules } from "../helper/validator";

const router = express.Router();

router.get("/getconnection", authCheck, connectionController.getConnections);
router.post(
  "/createConnection",
  authCheck,
  createConnectionRules,
  connectionController.saveConnections
);
router.post("/generateQBWCXML", authCheck, connectionController.getqwcFile);
router.post("/saveUser", authCheck, connectionController.saveConnections);
router.delete("/:id", authCheck, connectionController.deleteConnection);
export default router;

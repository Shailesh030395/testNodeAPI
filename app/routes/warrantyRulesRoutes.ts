import { Router } from "express";
import rulesController from "../controllers/warrantyRulesController";
import { authCheck } from "../middleware/authMiddleware";
const ruleRoutes = Router();

// For creating a single rule
ruleRoutes.post("/create", authCheck, rulesController.createRule);

// For bulk adding rules
ruleRoutes.post("/bulk-add", authCheck, rulesController.bulkAddRules);

// For getting a single rule by ID
ruleRoutes.get("/:id", authCheck, rulesController.getARule);

// For getting all rules in an organization
ruleRoutes.post("/", authCheck, rulesController.getAllRules);

// For updating a rule
ruleRoutes.post("/update-rule", authCheck, rulesController.updateRule);

// For updating the expiry date
ruleRoutes.post("/upsert-month", authCheck, rulesController.upsertMonth);

// For updating the expiry date
ruleRoutes.post("/default-month", authCheck, rulesController.getDefaultMonth);

// For deleting a rule
ruleRoutes.delete("/", authCheck, rulesController.deleteRule);

export default ruleRoutes;

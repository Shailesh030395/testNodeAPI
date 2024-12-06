import { Router } from "express";
import rolesController from "../controllers/rolesController";
import { authCheck } from "../middleware/authMiddleware";
const roleRoutes = Router();

//For create a single role
roleRoutes.post("/create", authCheck, rolesController.createRole);
// For get single roles from that company
roleRoutes.get("/single-role/:id", authCheck, rolesController.getARole);
// For get All the roles from that company
roleRoutes.get("/organization-roles", authCheck, rolesController.getAllRoles);
// for update the some role
roleRoutes.post("/update-role", authCheck, rolesController.updateRole);
// for delete the role
roleRoutes.delete("/", authCheck, rolesController.deleteRole);

export default roleRoutes;

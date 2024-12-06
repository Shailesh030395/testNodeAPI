import express from "express";
import { authCheck } from "../middleware/authMiddleware";
import userController from "../controllers/userController";
const router = express.Router();
router.get("/", authCheck, userController.getAllUsers);
// Get User Details By Id   {Change the route of this id as if we use the same get method it will be called as it takes thing as argument Id.}
router.get("/:id", authCheck, userController.getUserDetails);
// Create New User
router.post("/", authCheck, userController.createUser);
// Update by Id
router.put("/", authCheck, userController.updateUser);
// Invite User
router.post("/invite-user", authCheck, userController.inviteUser);
// Delete User
router.delete("/", authCheck, userController.deleteUser);

export default router;

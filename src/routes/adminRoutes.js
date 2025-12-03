import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";
import {
  listUsers,
  updateUserPlan,
  setBlockStatus,
  deleteUser,
} from "../controllers/adminController.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/users", listUsers);
router.patch("/users/:id/plan", updateUserPlan);
router.patch("/users/:id/block", setBlockStatus);
router.delete("/users/:id", deleteUser);

export default router;

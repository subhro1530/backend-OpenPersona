import { Router } from "express";
import {
  register,
  registerAdmin,
  login,
  me,
  upgradeToAdmin,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/register/admin", authLimiter, registerAdmin);
router.post("/login", authLimiter, login);
router.get("/me", authenticate, me);
router.post("/upgrade/admin", authenticate, upgradeToAdmin);

export default router;

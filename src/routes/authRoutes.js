import { Router } from "express";
import {
  register,
  registerAdmin,
  login,
  me,
  upgradeToAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  requestVerification,
  verifyEmail,
  logout,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/register/admin", authLimiter, registerAdmin);
router.post("/login", authLimiter, login);
router.get("/me", authenticate, me);
router.post("/upgrade/admin", authenticate, upgradeToAdmin);

// Password management
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/change-password", authenticate, changePassword);

// Email verification
router.post("/request-verification", authenticate, requestVerification);
router.post("/verify-email", verifyEmail);

// Logout
router.post("/logout", authenticate, logout);

export default router;

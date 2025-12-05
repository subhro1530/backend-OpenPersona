import { Router } from "express";
import {
  getUserSettings,
  patchUserSettings,
  patchNotificationSettings,
  patchPrivacySettings,
  deleteUserAccount,
} from "../controllers/settingsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, getUserSettings);
router.patch("/", authenticate, patchUserSettings);
router.patch("/notifications", authenticate, patchNotificationSettings);
router.patch("/privacy", authenticate, patchPrivacySettings);
router.delete("/account", authenticate, deleteUserAccount);

export default router;

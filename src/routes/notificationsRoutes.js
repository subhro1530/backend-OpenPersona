import { Router } from "express";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, listNotifications);
router.patch("/:id/read", authenticate, markNotificationRead);
router.patch("/read-all", authenticate, markAllNotificationsRead);
router.delete("/:id", authenticate, deleteNotification);
router.delete("/", authenticate, clearAllNotifications);

export default router;

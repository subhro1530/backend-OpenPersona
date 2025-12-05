import { Router } from "express";
import {
  trackDashboardView,
  trackLinkClick,
  getDashboardAnalytics,
  getOverallAnalytics,
  createDashboardShareLink,
  getDashboardByShareToken,
  revokeDashboardShareLink,
  duplicateUserDashboard,
  reorderUserDashboards,
} from "../controllers/dashboardAnalyticsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Public tracking endpoints
router.post("/:id/track/view", trackDashboardView);
router.post("/:id/track/click", trackLinkClick);
router.get("/share/:token", getDashboardByShareToken);

// Authenticated endpoints
router.get("/analytics", authenticate, getOverallAnalytics);
router.get("/:id/analytics", authenticate, getDashboardAnalytics);
router.post("/:id/share", authenticate, createDashboardShareLink);
router.delete("/:id/share/:shareId", authenticate, revokeDashboardShareLink);
router.post("/:id/duplicate", authenticate, duplicateUserDashboard);
router.post("/reorder", authenticate, reorderUserDashboards);

export default router;

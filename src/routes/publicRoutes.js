import { Router } from "express";
import {
  getPublicProfile,
  getPublicPlan,
  getPublicDashboardBySlug,
} from "../controllers/publicController.js";

const router = Router();

router.get("/dashboards/:uid/:slug", getPublicDashboardBySlug);
router.get("/profile/:uid", getPublicProfile);
router.get("/profile/:uid/plan/:plan", getPublicPlan);

// Legacy routes for backward compatibility
router.get("/:uid", getPublicProfile);
router.get("/:uid/:plan", getPublicPlan);

export default router;

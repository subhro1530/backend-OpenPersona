import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getProfileInsights,
  generateDashboardLayout,
  getAgentSuggestions,
} from "../controllers/agentController.js";

const router = Router();

router.use(authenticate);
router.get("/profile-insights", getProfileInsights);
router.post("/generate-dashboard", generateDashboardLayout);
router.post("/suggestions", getAgentSuggestions);

export default router;

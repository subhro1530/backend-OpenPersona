import { Router } from "express";
import {
  askIdentityCopilot,
  createJobMatchBrief,
  getIdentityHighlights,
} from "../controllers/supportController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/highlights", getIdentityHighlights);
router.post("/job-match", createJobMatchBrief);
router.post("/copilot", askIdentityCopilot);

export default router;

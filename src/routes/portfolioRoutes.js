import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getPortfolioBlueprint,
  getPortfolioStatus,
  generatePortfolioDraft,
  savePortfolio,
  enhancePortfolioText,
  publishPortfolio,
  getPortfolioTemplates,
} from "../controllers/portfolioController.js";
import { deleteDashboard } from "../controllers/dashboardController.js";

const router = Router();

router.use(authenticate);
router.get("/blueprint", getPortfolioBlueprint);
router.get("/status", getPortfolioStatus);
router.get("/templates", getPortfolioTemplates);
router.post("/draft", generatePortfolioDraft);
router.post("/save", savePortfolio);
router.post("/publish", publishPortfolio);
router.post("/enhance-text", enhancePortfolioText);
router.delete("/dashboard/:id", deleteDashboard);

export default router;

import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getPortfolioBlueprint,
  generatePortfolioDraft,
  savePortfolio,
  enhancePortfolioText,
} from "../controllers/portfolioController.js";
import { deleteDashboard } from "../controllers/dashboardController.js";

const router = Router();

router.use(authenticate);
router.get("/blueprint", getPortfolioBlueprint);
router.post("/draft", generatePortfolioDraft);
router.post("/save", savePortfolio);
router.post("/enhance-text", enhancePortfolioText);
router.delete("/dashboard/:id", deleteDashboard);

export default router;

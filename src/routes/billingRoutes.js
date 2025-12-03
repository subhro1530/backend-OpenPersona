import { Router } from "express";
import { getPlans } from "../controllers/billingController.js";

const router = Router();

router.get("/plans", getPlans);

export default router;

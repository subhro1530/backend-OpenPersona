import { Router } from "express";
import {
  getPlans,
  getCurrentSubscription,
  getBillingHistory,
  upgradePlan,
  cancelSubscription,
  getInvoice,
  paymentWebhook,
} from "../controllers/billingController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/plans", getPlans);
router.get("/subscription", authenticate, getCurrentSubscription);
router.get("/history", authenticate, getBillingHistory);
router.post("/upgrade", authenticate, upgradePlan);
router.post("/cancel", authenticate, cancelSubscription);
router.get("/invoices/:id", authenticate, getInvoice);
router.post("/webhook", paymentWebhook);

export default router;

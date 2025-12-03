import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  listDashboards,
  createDashboard,
  getDashboard,
  updateDashboard,
  deleteDashboard,
} from "../controllers/dashboardController.js";

const router = Router();

router.use(authenticate);
router.get("/", listDashboards);
router.post("/create", createDashboard);
router.get("/:id", getDashboard);
router.put("/:id", updateDashboard);
router.delete("/:id", deleteDashboard);

export default router;

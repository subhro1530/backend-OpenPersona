import { Router } from "express";
import {
  exportUserData,
  importUserData,
  exportResumePDF,
} from "../controllers/exportImportController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/export", authenticate, exportUserData);
router.post("/import", authenticate, importUserData);
router.get("/export/pdf", authenticate, exportResumePDF);

export default router;

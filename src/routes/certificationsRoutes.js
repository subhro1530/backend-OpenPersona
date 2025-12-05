import { Router } from "express";
import {
  listCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  reorderCertifications,
} from "../controllers/crudController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, listCertifications);
router.post("/", authenticate, createCertification);
router.put("/:id", authenticate, updateCertification);
router.delete("/:id", authenticate, deleteCertification);
router.post("/reorder", authenticate, reorderCertifications);

export default router;

import { Router } from "express";
import {
  listExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  reorderExperiences,
} from "../controllers/crudController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, listExperiences);
router.post("/", authenticate, createExperience);
router.put("/:id", authenticate, updateExperience);
router.delete("/:id", authenticate, deleteExperience);
router.post("/reorder", authenticate, reorderExperiences);

export default router;

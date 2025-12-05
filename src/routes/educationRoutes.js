import { Router } from "express";
import {
  listEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  reorderEducation,
} from "../controllers/crudController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, listEducation);
router.post("/", authenticate, createEducation);
router.put("/:id", authenticate, updateEducation);
router.delete("/:id", authenticate, deleteEducation);
router.post("/reorder", authenticate, reorderEducation);

export default router;

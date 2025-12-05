import { Router } from "express";
import {
  listSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
} from "../controllers/crudController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, listSkills);
router.post("/", authenticate, createSkill);
router.put("/:id", authenticate, updateSkill);
router.delete("/:id", authenticate, deleteSkill);
router.post("/reorder", authenticate, reorderSkills);

export default router;

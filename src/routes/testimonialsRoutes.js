import { Router } from "express";
import {
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
} from "../controllers/crudController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, listTestimonials);
router.post("/", authenticate, createTestimonial);
router.put("/:id", authenticate, updateTestimonial);
router.delete("/:id", authenticate, deleteTestimonial);
router.post("/reorder", authenticate, reorderTestimonials);

export default router;

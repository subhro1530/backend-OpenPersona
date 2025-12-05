import { Router } from "express";
import {
  listSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  reorderSocialLinks,
} from "../controllers/crudController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, listSocialLinks);
router.post("/", authenticate, createSocialLink);
router.put("/:id", authenticate, updateSocialLink);
router.delete("/:id", authenticate, deleteSocialLink);
router.post("/reorder", authenticate, reorderSocialLinks);

export default router;

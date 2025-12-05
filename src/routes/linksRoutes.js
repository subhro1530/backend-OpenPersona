import { Router } from "express";
import {
  listLinks,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
} from "../controllers/crudController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, listLinks);
router.post("/", authenticate, createLink);
router.put("/:id", authenticate, updateLink);
router.delete("/:id", authenticate, deleteLink);
router.post("/reorder", authenticate, reorderLinks);

export default router;

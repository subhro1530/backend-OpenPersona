import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  updateHandle,
  updateTemplate,
} from "../controllers/profileController.js";

const router = Router();

router.get("/", authenticate, getProfile);
router.put("/", authenticate, updateProfile);
router.patch("/handle", authenticate, updateHandle);
router.patch("/template", authenticate, updateTemplate);

export default router;

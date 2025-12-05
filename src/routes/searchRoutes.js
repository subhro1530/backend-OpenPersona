import { Router } from "express";
import {
  searchProfiles,
  searchUserContent,
  adminGlobalSearch,
} from "../controllers/searchController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/profiles", searchProfiles);
router.get("/content", authenticate, searchUserContent);
router.get("/admin", authenticate, adminGlobalSearch);

export default router;

import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  resumeUploadMiddleware,
  uploadResume,
  listResumes,
  analyzeResume,
  getResumeUrl,
} from "../controllers/resumeController.js";

const router = Router();

router.use(authenticate);
router.get("/", listResumes);
router.post("/upload", resumeUploadMiddleware, uploadResume);
router.get("/:id/url", getResumeUrl);
router.post("/analyze", analyzeResume);

export default router;

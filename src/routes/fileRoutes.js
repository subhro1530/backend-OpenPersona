import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  fileUploadMiddleware,
  uploadFile,
  listFiles,
  getFileUrl,
  deleteFile,
} from "../controllers/fileController.js";

const router = Router();

router.use(authenticate);
router.post("/upload", fileUploadMiddleware, uploadFile);
router.get("/", listFiles);
router.get("/:id/url", getFileUrl);
router.delete("/:id", deleteFile);

export default router;

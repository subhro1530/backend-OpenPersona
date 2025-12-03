import { Router } from "express";
import { listTemplates } from "../controllers/templateController.js";

const router = Router();

router.get("/", listTemplates);

export default router;

import multer from "multer";
import pool from "../config/db.js";
import {
  uploadFile,
  generateSignedUrl,
  getObjectBuffer,
} from "../utils/s3Helpers.js";
import { validateResumeAnalyze } from "../utils/validators.js";
import { getGeminiModel } from "../config/ai.js";

const storage = multer.memoryStorage();
export const resumeUploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("resume");

const buildResumeKey = (userId, originalName) =>
  `users/${userId}/resumes/${Date.now()}-${originalName}`;

const fetchResume = async (userId, resumeId) => {
  const result = await pool.query(
    `SELECT id, object_key, mime_type, size, analysis, analyzed_at, created_at
     FROM resumes
     WHERE user_id = $1 ${resumeId ? "AND id = $2" : ""}
     ORDER BY created_at DESC
     LIMIT 1`,
    resumeId ? [userId, resumeId] : [userId]
  );
  return result.rows[0];
};

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("Resume file is required.");
    }

    const key = buildResumeKey(req.user.id, req.file.originalname);
    await uploadFile(req.file.buffer, req.file.mimetype, key);

    const result = await pool.query(
      `INSERT INTO resumes (user_id, object_key, mime_type, size)
       VALUES ($1, $2, $3, $4)
       RETURNING id, object_key, mime_type, size, created_at`,
      [req.user.id, key, req.file.mimetype, req.file.size]
    );

    return res.status(201).json({ resume: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const listResumes = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, object_key, mime_type, size, analysis, analyzed_at, created_at
       FROM resumes WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ resumes: result.rows });
  } catch (error) {
    return next(error);
  }
};

export const getResumeUrl = async (req, res, next) => {
  try {
    const resume = await fetchResume(req.user.id, req.params.id);
    if (!resume) {
      res.status(404);
      throw new Error("Resume not found.");
    }

    const url = await generateSignedUrl(resume.object_key, 300);
    return res.json({ url });
  } catch (error) {
    return next(error);
  }
};

const buildResumePrompt = (resumeText, strategy, notes) =>
  `You are the OpenPersona resume intelligence agent.\n\nRULES:\n- ONLY use the resume text provided.\n- NEVER invent experience, companies, dates, or achievements.\n- Respond with VALID minified JSON shaped as:\n{\n  "contact": {"name":"","email":"","phone":"","location":""},\n  "summary": "",\n  "keywords": [],\n  "skills": [{"name":"","level":""}],\n  "experiences": [{"company":"","role":"","summary":"","startDate":"","endDate":""}],\n  "education": [{"institution":"","degree":"","summary":"","startDate":"","endDate":""}],\n  "projects": [{"title":"","description":"","tags":[],"links":[]}],\n  "achievements": [{"title":"","description":""}],\n  "certifications": [{"name":"","issuer":"","summary":"","credentialId":"","issuedAt":"","expiresAt":""}]\n}\n\nStrategy: ${strategy}.\nNotes: ${
    notes || "None"
  }.\n\nResume text:\n"""${resumeText.slice(0, 15000)}"""`;

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

const emptyAnalysis = {
  contact: {},
  summary: "",
  keywords: [],
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  achievements: [],
  certifications: [],
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) => (value && typeof value === "object" ? value : {});

const normalizeAnalysis = (data) => {
  const source = asObject(data);
  return {
    ...emptyAnalysis,
    ...source,
    contact: asObject(source.contact),
    keywords: asArray(source.keywords),
    skills: asArray(source.skills),
    experiences: asArray(source.experiences),
    education: asArray(source.education),
    projects: asArray(source.projects),
    achievements: asArray(source.achievements),
    certifications: asArray(source.certifications),
  };
};

const buildPortfolioDraft = (analysis) => ({
  summary: analysis.summary,
  skills: analysis.skills,
  experiences: analysis.experiences,
  education: analysis.education,
  projects: analysis.projects,
  achievements: analysis.achievements,
  certifications: analysis.certifications,
  keywords: analysis.keywords,
});

export const analyzeResume = async (req, res, next) => {
  try {
    const payload = await validateResumeAnalyze(req.body);
    const resume = await fetchResume(req.user.id, payload.resumeId);

    if (!resume) {
      res.status(404);
      throw new Error("Upload a resume before requesting analysis.");
    }

    const buffer = await getObjectBuffer(resume.object_key);
    const resumeText = buffer.toString("utf8") || "";
    if (!resumeText) {
      res.status(400);
      throw new Error("Unable to read resume contents");
    }

    const model = getGeminiModel();
    const prompt = buildResumePrompt(
      resumeText,
      payload.strategy,
      payload.notes
    );
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = safeJsonParse(responseText);
    const normalized = parsed ? normalizeAnalysis(parsed) : null;
    const payloadToStore = normalized
      ? { ...normalized, portfolioDraft: buildPortfolioDraft(normalized) }
      : { raw: responseText };

    const update = await pool.query(
      `UPDATE resumes SET analysis = $1, analyzed_at = NOW() WHERE id = $2
       RETURNING id, object_key, mime_type, size, analysis, analyzed_at, created_at`,
      [payloadToStore, resume.id]
    );

    return res.json({ resume: update.rows[0] });
  } catch (error) {
    return next(error);
  }
};

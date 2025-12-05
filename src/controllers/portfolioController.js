import pool from "../config/db.js";
import { getGeminiModel } from "../config/ai.js";
import { getObjectBuffer } from "../utils/s3Helpers.js";
import {
  validatePortfolioDraft,
  validatePortfolioSave,
  validateEnhanceText,
} from "../utils/validators.js";
import {
  fetchPortfolioData,
  savePortfolioData,
  evaluatePortfolioReadiness,
  publishPrimaryDashboard,
  buildPortfolioLinks,
} from "../services/portfolioService.js";
import { PORTFOLIO_REQUIREMENTS } from "../config/portfolio.js";
import { listActiveTemplates } from "../services/templateService.js";

const fetchResumeRecord = async (userId, resumeId) => {
  if (resumeId) {
    const result = await pool.query(
      `SELECT id, object_key, analysis FROM resumes WHERE user_id = $1 AND id = $2 LIMIT 1`,
      [userId, resumeId]
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `SELECT id, object_key, analysis FROM resumes WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0];
};

const emptyDraft = {
  summary: "",
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  achievements: [],
  certifications: [],
  keywords: [],
};

const normalizeDraft = (data) => {
  if (!data || typeof data !== "object") {
    return { ...emptyDraft };
  }
  return {
    summary: data.summary || "",
    skills: Array.isArray(data.skills) ? data.skills : [],
    experiences: Array.isArray(data.experiences) ? data.experiences : [],
    education: Array.isArray(data.education) ? data.education : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    certifications: Array.isArray(data.certifications)
      ? data.certifications
      : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
  };
};

const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

const buildDraftPrompt = (resumeText, notes) =>
  `You are the OpenPersona portfolio architect.\n\nTask: Convert the resume text into a structured portfolio draft with all essential sections.\nRules:\n- Only rely on the user-provided resume text.\n- Never fabricate companies, roles, dates, or credentials.\n- Return VALID minified JSON with keys summary, skills, experiences, education, projects, achievements, certifications, keywords.\n- Each collection must be an array.\n\nAdditional editor notes: ${
    notes || "None"
  }.\n\nResume:\n"""${resumeText.slice(0, 15000)}"""`;

const buildEnhancePrompt = (text, tone, persona) =>
  `You are the OpenPersona AI writing coach. Improve the provided identity text while keeping it truthful.\nTone: ${tone}.\nPersona: ${
    persona || "General professional"
  }.\n\nRespond with JSON: {"enhancedText":"...","headline":"...","suggestions":["..."]}.\nText:\n"""${text}"""`;

export const getPortfolioBlueprint = async (req, res, next) => {
  try {
    const [portfolio, templates] = await Promise.all([
      fetchPortfolioData(req.user.id),
      listActiveTemplates(),
    ]);
    const readiness = evaluatePortfolioReadiness(portfolio);
    const links = buildPortfolioLinks(req.user.handle, portfolio.dashboards);
    return res.json({
      portfolio,
      readiness,
      links,
      requirements: PORTFOLIO_REQUIREMENTS,
      templates,
    });
  } catch (error) {
    return next(error);
  }
};

export const getPortfolioStatus = async (req, res, next) => {
  try {
    const [portfolio, templates] = await Promise.all([
      fetchPortfolioData(req.user.id),
      listActiveTemplates(),
    ]);
    const readiness = evaluatePortfolioReadiness(portfolio);
    const links = buildPortfolioLinks(req.user.handle, portfolio.dashboards);
    return res.json({
      readiness,
      links,
      requirements: PORTFOLIO_REQUIREMENTS,
      templates,
    });
  } catch (error) {
    return next(error);
  }
};

export const generatePortfolioDraft = async (req, res, next) => {
  try {
    const payload = await validatePortfolioDraft(req.body);
    const resume = await fetchResumeRecord(req.user.id, payload.resumeId);

    if (!resume) {
      res.status(404);
      throw new Error("Upload a resume before generating a draft.");
    }

    const buffer = await getObjectBuffer(resume.object_key);
    const resumeText = buffer.toString("utf8");
    if (!resumeText) {
      res.status(400);
      throw new Error("Resume file is empty or unreadable.");
    }

    const model = getGeminiModel();
    const prompt = buildDraftPrompt(resumeText, payload.notes);
    const result = await model.generateContent(prompt);
    const parsed = safeParse(result.response.text());
    const draft = normalizeDraft(parsed);

    await pool.query(
      `UPDATE resumes
         SET analysis = jsonb_set(COALESCE(analysis, '{}'::jsonb), '{portfolioDraft}', $1::jsonb, true),
             analyzed_at = COALESCE(analyzed_at, NOW())
       WHERE id = $2`,
      [JSON.stringify(draft), resume.id]
    );

    return res.json({ draft });
  } catch (error) {
    return next(error);
  }
};

export const savePortfolio = async (req, res, next) => {
  try {
    const payload = await validatePortfolioSave(req.body);
    let portfolio = await savePortfolioData(req.user, payload);
    let readiness = evaluatePortfolioReadiness(portfolio);
    let links = buildPortfolioLinks(req.user.handle, portfolio.dashboards);

    if (payload.publish) {
      if (!readiness.ready) {
        res.status(422);
        return res.json({
          portfolio,
          readiness,
          links,
          message: "Fill the required sections before publishing.",
        });
      }

      await publishPrimaryDashboard(req.user.id);
      portfolio = await fetchPortfolioData(req.user.id);
      readiness = evaluatePortfolioReadiness(portfolio);
      links = buildPortfolioLinks(req.user.handle, portfolio.dashboards);
    }

    return res.json({ portfolio, readiness, links });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    return next(error);
  }
};

export const publishPortfolio = async (req, res, next) => {
  try {
    const portfolio = await fetchPortfolioData(req.user.id);
    const readiness = evaluatePortfolioReadiness(portfolio);

    if (!readiness.ready) {
      res.status(422);
      return res.json({
        readiness,
        requirements: PORTFOLIO_REQUIREMENTS,
        message: "Portfolio is missing required sections.",
      });
    }

    await publishPrimaryDashboard(req.user.id);
    const refreshed = await fetchPortfolioData(req.user.id);
    const links = buildPortfolioLinks(req.user.handle, refreshed.dashboards);
    const updatedReadiness = evaluatePortfolioReadiness(refreshed);

    return res.json({
      portfolio: refreshed,
      readiness: updatedReadiness,
      links,
      published: true,
    });
  } catch (error) {
    return next(error);
  }
};

export const enhancePortfolioText = async (req, res, next) => {
  try {
    const payload = await validateEnhanceText(req.body);
    const model = getGeminiModel();
    const prompt = buildEnhancePrompt(
      payload.text,
      payload.tone,
      payload.persona
    );
    const result = await model.generateContent(prompt);
    const fallback = {
      enhancedText: payload.text,
      headline: null,
      suggestions: [],
    };
    const enhanced = safeParse(result.response.text()) || fallback;
    return res.json({ enhanced });
  } catch (error) {
    return next(error);
  }
};

export const getPortfolioTemplates = async (_req, res, next) => {
  try {
    const templates = await listActiveTemplates();
    return res.json({ templates });
  } catch (error) {
    return next(error);
  }
};

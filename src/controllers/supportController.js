import { getGeminiModel } from "../config/ai.js";
import { getIdentityBundle } from "../services/identityService.js";
import { validateCopilot, validateJobMatch } from "../utils/validators.js";

const safeParse = (payload, fallback) => {
  try {
    const data = JSON.parse(payload);
    return data && typeof data === "object" ? data : fallback;
  } catch (error) {
    return fallback;
  }
};

const buildPrompt = (instruction, data) => `You are the OpenPersona support AI.
Rules:
- Operate only on the JSON content given.
- Never fabricate or fetch external data.
- Keep responses concise and structured.
- Respond with VALID minified JSON only.

Instruction: ${instruction}

JSON payload:
${JSON.stringify(data, null, 2)}
`;

export const getIdentityHighlights = async (req, res, next) => {
  try {
    const identity = await getIdentityBundle(req.user.id);
    const payload = {
      profile: identity.profile,
      dashboards: identity.dashboards,
      resumes: identity.resumes.slice(0, 3),
      signals: {
        latestAnalysis: identity.latestAnalysis,
        skills: identity.skills.slice(0, 10),
        projects: identity.projects.slice(0, 5),
      },
    };

    const model = getGeminiModel();
    const prompt = buildPrompt(
      "Create personal highlights, momentum indicators, and suggested talking points.",
      payload
    );
    const result = await model.generateContent(prompt);
    const fallback = {
      moments: [],
      momentum: [],
      talkingPoints: [],
    };
    const highlights = safeParse(result.response.text(), fallback);
    return res.json({ highlights });
  } catch (error) {
    return next(error);
  }
};

export const createJobMatchBrief = async (req, res, next) => {
  try {
    const payload = await validateJobMatch(req.body);
    const identity = await getIdentityBundle(req.user.id);
    const context = {
      job: payload,
      profile: identity.profile,
      skills: identity.skills,
      resumes: identity.resumes.slice(0, 2),
      analysis: identity.latestAnalysis,
    };
    const model = getGeminiModel();
    const prompt = buildPrompt(
      "Compare the user identity with the job role. Return JSON with keys matchScore (0-100), strengths[], gaps[], and actions[].",
      context
    );
    const result = await model.generateContent(prompt);
    const fallback = {
      matchScore: 0,
      strengths: [],
      gaps: [],
      actions: [],
    };
    const brief = safeParse(result.response.text(), fallback);
    return res.json({ match: brief });
  } catch (error) {
    return next(error);
  }
};

export const askIdentityCopilot = async (req, res, next) => {
  try {
    const payload = await validateCopilot(req.body);
    const identity = await getIdentityBundle(req.user.id);
    const context = {
      question: payload.question,
      tone: payload.tone,
      context: payload.context,
      profile: identity.profile,
      latestDashboard: identity.dashboards[0] || null,
      resumes: identity.resumes.slice(0, 1),
      analysis: identity.latestAnalysis,
    };

    const model = getGeminiModel();
    const prompt = buildPrompt(
      "Answer as a helpful identity copilot. Provide JSON with answer, followUps[], and inspirations[].",
      context
    );
    const result = await model.generateContent(prompt);
    const fallback = {
      answer: "Unable to generate a response right now.",
      followUps: [],
      inspirations: [],
    };
    const reply = safeParse(result.response.text(), fallback);
    return res.json({ response: reply });
  } catch (error) {
    return next(error);
  }
};

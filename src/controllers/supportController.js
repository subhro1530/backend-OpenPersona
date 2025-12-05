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

const buildHighlightsFallback = (payload) => {
  const profileName =
    payload.profile?.name || payload.profile?.headline || "Identity";
  const skillCount = payload.signals.skills.length;
  const projectCount = payload.signals.projects.length;
  return {
    moments: [
      {
        title: `${profileName} is live`,
        summary: `${projectCount} showcase projects and ${skillCount} core skills are ready for briefings.`,
        action: "Share the latest dashboard with hiring teams.",
      },
    ],
    momentum: [
      {
        label: "Skills",
        status: skillCount >= 3 ? "On track" : "Add more",
        insight: `You currently list ${skillCount} skills. Add depth with proficiency notes.`,
      },
      {
        label: "Projects",
        status: projectCount ? "Story-ready" : "Needs case studies",
        insight: projectCount
          ? `${projectCount} projects available for case-study mode.`
          : "Add at least one project to unlock highlights.",
      },
    ],
    talkingPoints: [
      payload.profile?.headline || "Lead with your core value statement.",
      projectCount
        ? `Walk through ${
            payload.signals.projects[0]?.title || "your top project"
          }.`
        : "Add a flagship project story to unlock richer highlights.",
      "Close with a clear CTA (book a call, view dashboard, download resume).",
    ].filter(Boolean),
  };
};

const runGeminiHighlights = async (payload) => {
  const fallback = buildHighlightsFallback(payload);
  try {
    const model = getGeminiModel();
    const prompt = buildPrompt(
      "Create personal highlights, momentum indicators, and suggested talking points.",
      payload
    );
    const result = await model.generateContent(prompt);
    const highlights = safeParse(result.response.text(), fallback);
    return { highlights, offline: false };
  } catch (error) {
    console.error("[SupportAI] highlights failed", error.message);
    return { highlights: fallback, offline: true };
  }
};

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

    const result = await runGeminiHighlights(payload);
    return res.json({ highlights: result.highlights, offline: result.offline });
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

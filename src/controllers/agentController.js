import { getGeminiModel } from "../config/ai.js";
import { validateAgentPrompt } from "../utils/validators.js";
import { getIdentityBundle } from "../services/identityService.js";

const buildPrivacyPrompt = (task, data) =>
  `You are the OpenPersona identity agent.\n\nStrict privacy rules:\n- ONLY analyze the JSON content below.\n- NEVER infer or invent data that is not provided.\n- NEVER fetch from external sources or mention outside knowledge.\n- NEVER guess personal information.\n\nTask: ${task}.\n\nUser-provided JSON content:\n${JSON.stringify(
    data,
    null,
    2
  )}\n\nRespond with clear, structured insights. Stay privacy-safe.`;

const runAgent = async (task, data) => {
  const model = getGeminiModel();
  const prompt = buildPrivacyPrompt(task, data);
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const toJsonString = (value) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

const fallbackProfileInsights = (identity) => {
  const headline = identity.profile?.headline || "Identity in progress";
  const summary =
    identity.profile?.bio ||
    "Add a bio to help the agent generate richer insights.";
  return {
    summary,
    headline,
    skills: identity.skills.slice(0, 5).map((skill) => skill.name),
    recommendedActions: [
      identity.projects.length
        ? "Convert your top project into a case study block."
        : "Add at least one flagship project to unlock storytelling blocks.",
      "Refresh your dashboard hero copy with a strong CTA.",
    ],
  };
};

const fallbackDashboardLayout = (identity) => ({
  layout: [
    {
      section: "hero",
      content: identity.profile?.headline || "Identity spotlight",
    },
    {
      section: "skills",
      items: identity.skills.slice(0, 6).map((skill) => skill.name),
    },
    { section: "projects", count: identity.projects.length },
    { section: "cta", text: "Book a call" },
  ],
  inspiration: "AI offline fallback",
});

const fallbackSuggestions = (identity) => ({
  tags: identity.skills.slice(0, 5).map((skill) => skill.name.toLowerCase()),
  priorities: [
    "Capture a before/after win for your strongest project.",
    "Publish your primary dashboard to unlock sharing links.",
  ],
});

const runAgentWithFallback = async (task, data, fallbackBuilder, label) => {
  try {
    const output = await runAgent(task, data);
    return { result: output, offline: false };
  } catch (error) {
    console.error(`[AgentAI] ${label} failed`, error.message);
    return { result: toJsonString(fallbackBuilder(data)), offline: true };
  }
};

export const getProfileInsights = async (req, res, next) => {
  try {
    const identityData = await getIdentityBundle(req.user.id);
    const { result, offline } = await runAgentWithFallback(
      "Generate a concise profile summary, skill highlights, and improvement actions.",
      identityData,
      fallbackProfileInsights,
      "profile-insights"
    );
    return res.json({ insights: result, offline });
  } catch (error) {
    return next(error);
  }
};

export const generateDashboardLayout = async (req, res, next) => {
  try {
    const payload = await validateAgentPrompt(req.body);
    const identityData = await getIdentityBundle(req.user.id);
    const merged = { ...identityData, request: payload };
    const { result, offline } = await runAgentWithFallback(
      "Design a dashboard layout with section ordering, component ideas, and CTA suggestions.",
      merged,
      fallbackDashboardLayout,
      "dashboard-layout"
    );
    return res.json({ layout: result, offline });
  } catch (error) {
    return next(error);
  }
};

export const getAgentSuggestions = async (req, res, next) => {
  try {
    const payload = await validateAgentPrompt(req.body);
    const identityData = await getIdentityBundle(req.user.id);
    const merged = { ...identityData, prompt: payload };
    const { result, offline } = await runAgentWithFallback(
      "Provide strategic identity suggestions, tags, and keywords.",
      merged,
      fallbackSuggestions,
      "agent-suggestions"
    );
    return res.json({ suggestions: result, offline });
  } catch (error) {
    return next(error);
  }
};

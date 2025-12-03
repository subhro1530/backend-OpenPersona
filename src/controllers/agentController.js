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

export const getProfileInsights = async (req, res, next) => {
  try {
    const identityData = await getIdentityBundle(req.user.id);
    const output = await runAgent(
      "Generate a concise profile summary, skill highlights, and improvement actions.",
      identityData
    );
    return res.json({ insights: output });
  } catch (error) {
    return next(error);
  }
};

export const generateDashboardLayout = async (req, res, next) => {
  try {
    const payload = await validateAgentPrompt(req.body);
    const identityData = await getIdentityBundle(req.user.id);
    const merged = { ...identityData, request: payload };
    const output = await runAgent(
      "Design a dashboard layout with section ordering, component ideas, and CTA suggestions.",
      merged
    );
    return res.json({ layout: output });
  } catch (error) {
    return next(error);
  }
};

export const getAgentSuggestions = async (req, res, next) => {
  try {
    const payload = await validateAgentPrompt(req.body);
    const identityData = await getIdentityBundle(req.user.id);
    const merged = { ...identityData, prompt: payload };
    const output = await runAgent(
      "Provide strategic identity suggestions, tags, and keywords.",
      merged
    );
    return res.json({ suggestions: output });
  } catch (error) {
    return next(error);
  }
};

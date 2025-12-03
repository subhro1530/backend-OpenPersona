import Joi from "joi";

const baseOptions = { abortEarly: false, stripUnknown: true }; // consistent validation behavior

const email = Joi.string().email({ tlds: { allow: false } });
const password = Joi.string().min(8).max(128);
const handle = Joi.string().pattern(/^[a-z0-9_]{3,30}$/);
const slug = Joi.string().pattern(/^[a-z0-9-]{3,64}$/);

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: email.required(),
  password: password.required(),
  handle: handle.required(),
});

const loginSchema = Joi.object({
  email: email.required(),
  password: password.required(),
});

const profileSchema = Joi.object({
  headline: Joi.string().max(240).allow("", null),
  bio: Joi.string().max(2000).allow("", null),
  location: Joi.string().max(120).allow("", null),
  avatarUrl: Joi.string().uri().allow("", null),
  bannerUrl: Joi.string().uri().allow("", null),
  template: Joi.string().max(64).allow("", null),
  socialLinks: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().max(40).required(),
        url: Joi.string().uri().required(),
      })
    )
    .default([]),
});

const handleUpdateSchema = Joi.object({ handle: handle.required() });

const templateUpdateSchema = Joi.object({
  template: slug.required(),
});

const dashboardCreateSchema = Joi.object({
  title: Joi.string().min(3).max(140).required(),
  slug: slug.optional(),
  visibility: Joi.string()
    .valid("private", "unlisted", "public")
    .default("private"),
  layout: Joi.object().unknown(true).default({}),
});

const dashboardUpdateSchema = dashboardCreateSchema.fork(
  ["title", "slug"],
  (schema) => schema.optional()
);

const agentPromptSchema = Joi.object({
  subject: Joi.string().max(140).required(),
  data: Joi.alternatives(
    Joi.object().unknown(true),
    Joi.array(),
    Joi.string()
  ).required(),
});

const resumeAnalyzeSchema = Joi.object({
  resumeId: Joi.string().uuid().optional(),
  strategy: Joi.string().valid("skills", "experience", "full").default("full"),
  notes: Joi.string().max(500).allow("", null),
});

const planChangeSchema = Joi.object({
  plan: Joi.string().valid("free", "growth", "scale").required(),
});

const adminBlockSchema = Joi.object({
  reason: Joi.string().max(240).allow("", null).default("Policy violation"),
  blocked: Joi.boolean().required(),
});

const jobMatchSchema = Joi.object({
  jobTitle: Joi.string().max(160).required(),
  jobDescription: Joi.string().min(40).max(8000).required(),
  company: Joi.string().max(160).allow("", null),
  focus: Joi.string().max(120).allow("", null),
});

const copilotSchema = Joi.object({
  question: Joi.string().min(10).max(4000).required(),
  context: Joi.alternatives(
    Joi.object().unknown(true),
    Joi.array(),
    Joi.string()
  ).allow(null),
  tone: Joi.string()
    .valid("casual", "friendly", "executive", "playful")
    .default("friendly"),
});

const experienceEntry = Joi.object({
  company: Joi.string().max(160).required(),
  role: Joi.string().max(160).required(),
  summary: Joi.string().max(2000).allow("", null),
  startDate: Joi.string().max(40).allow("", null),
  endDate: Joi.string().max(40).allow("", null),
});

const educationEntry = Joi.object({
  institution: Joi.string().max(160).required(),
  degree: Joi.string().max(160).allow("", null),
  summary: Joi.string().max(2000).allow("", null),
  startDate: Joi.string().max(40).allow("", null),
  endDate: Joi.string().max(40).allow("", null),
});

const projectEntry = Joi.object({
  title: Joi.string().max(180).required(),
  description: Joi.string().max(2000).allow("", null),
  tags: Joi.array().items(Joi.string().max(40)).default([]),
  links: Joi.array().items(Joi.string().uri()).default([]),
});

const achievementEntry = Joi.object({
  title: Joi.string().max(160).required(),
  description: Joi.string().max(2000).allow("", null),
});

const skillEntry = Joi.object({
  name: Joi.string().max(80).required(),
  level: Joi.string().max(80).allow("", null),
});

const certificationEntry = Joi.object({
  name: Joi.string().max(160).required(),
  issuer: Joi.string().max(160).allow("", null),
  summary: Joi.string().max(2000).allow("", null),
  credentialId: Joi.string().max(120).allow("", null),
  issuedAt: Joi.string().max(40).allow("", null),
  expiresAt: Joi.string().max(40).allow("", null),
});

const portfolioDraftSchema = Joi.object({
  resumeId: Joi.string().uuid().optional(),
  notes: Joi.string().max(500).allow("", null),
});

const portfolioSaveSchema = Joi.object({
  profile: profileSchema.optional(),
  summary: Joi.string().max(2000).allow("", null),
  experiences: Joi.array().items(experienceEntry).default([]),
  education: Joi.array().items(educationEntry).default([]),
  projects: Joi.array().items(projectEntry).default([]),
  achievements: Joi.array().items(achievementEntry).default([]),
  skills: Joi.array().items(skillEntry).default([]),
  certifications: Joi.array().items(certificationEntry).default([]),
  publish: Joi.boolean().default(false),
  dashboard: Joi.object({
    id: Joi.string().uuid().optional(),
    title: Joi.string().min(3).max(140).optional(),
    slug: slug.optional(),
    visibility: Joi.string().valid("private", "unlisted", "public").optional(),
    layout: Joi.object().unknown(true).optional(),
  }).optional(),
});

const enhanceTextSchema = Joi.object({
  text: Joi.string().min(20).max(4000).required(),
  tone: Joi.string()
    .valid("friendly", "executive", "bold", "playful", "technical")
    .default("friendly"),
  persona: Joi.string().max(160).allow("", null),
});

export const validateRegister = (payload) =>
  registerSchema.validateAsync(payload, baseOptions);
export const validateLogin = (payload) =>
  loginSchema.validateAsync(payload, baseOptions);
export const validateProfile = (payload) =>
  profileSchema.validateAsync(payload, baseOptions);
export const validateHandleUpdate = (payload) =>
  handleUpdateSchema.validateAsync(payload, baseOptions);
export const validateTemplateUpdate = (payload) =>
  templateUpdateSchema.validateAsync(payload, baseOptions);
export const validateDashboardCreate = (payload) =>
  dashboardCreateSchema.validateAsync(payload, baseOptions);
export const validateDashboardUpdate = (payload) =>
  dashboardUpdateSchema.validateAsync(payload, baseOptions);
export const validateAgentPrompt = (payload) =>
  agentPromptSchema.validateAsync(payload, baseOptions);
export const validateResumeAnalyze = (payload) =>
  resumeAnalyzeSchema.validateAsync(payload, baseOptions);
export const validatePlanChange = (payload) =>
  planChangeSchema.validateAsync(payload, baseOptions);
export const validateAdminBlock = (payload) =>
  adminBlockSchema.validateAsync(payload, baseOptions);
export const validateJobMatch = (payload) =>
  jobMatchSchema.validateAsync(payload, baseOptions);
export const validateCopilot = (payload) =>
  copilotSchema.validateAsync(payload, baseOptions);
export const validatePortfolioDraft = (payload) =>
  portfolioDraftSchema.validateAsync(payload, baseOptions);
export const validatePortfolioSave = (payload) =>
  portfolioSaveSchema.validateAsync(payload, baseOptions);
export const validateEnhanceText = (payload) =>
  enhanceTextSchema.validateAsync(payload, baseOptions);

export const validateSlug = async (value) =>
  slug.validateAsync(value, baseOptions);

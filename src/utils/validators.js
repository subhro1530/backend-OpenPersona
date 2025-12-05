import Joi from "joi";

const baseOptions = { abortEarly: false, stripUnknown: true }; // consistent validation behavior

const email = Joi.string().email({ tlds: { allow: false } });
const password = Joi.string().min(8).max(128);
const handle = Joi.string().pattern(/^[a-z0-9_]{3,30}$/);
const slug = Joi.string().pattern(/^[a-z0-9-]{3,64}$/);
const templateSlug = Joi.string().pattern(/^[a-z0-9-]{3,64}$/);

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: email.required(),
  password: password.required(),
  handle: handle.required(),
});

const adminRegisterSchema = registerSchema.keys({
  adminCode: Joi.string().min(6).max(120).required(),
});

const adminUpgradeSchema = Joi.object({
  adminCode: Joi.string().min(6).max(120).required(),
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
  template: templateSlug.lowercase().default("hire-me").allow(null),
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
  template: templateSlug.lowercase().required(),
});

const themeConfigSchema = Joi.object({
  fonts: Joi.object({
    heading: Joi.string().max(80).allow("", null),
    body: Joi.string().max(80).allow("", null),
    mono: Joi.string().max(80).allow("", null),
  }).default({}),
  colors: Joi.object()
    .pattern(/^[a-zA-Z0-9_-]+$/, Joi.string().max(32))
    .default({}),
  spacing: Joi.object()
    .pattern(/^[a-zA-Z0-9_-]+$/, Joi.string().max(16))
    .default({}),
  radii: Joi.object()
    .pattern(/^[a-zA-Z0-9_-]+$/, Joi.string().max(16))
    .default({}),
  shadows: Joi.object()
    .pattern(/^[a-zA-Z0-9_-]+$/, Joi.string().max(64))
    .default({}),
  typography: Joi.object()
    .pattern(
      /^[a-zA-Z0-9_-]+$/,
      Joi.object({
        size: Joi.string().max(16).allow("", null),
        lineHeight: Joi.string().max(16).allow("", null),
        weight: Joi.number().integer().min(100).max(900).allow(null),
      })
    )
    .default({}),
  tokens: Joi.object().unknown(true).default({}),
}).default({});

const componentSnippetSchema = Joi.object({
  language: Joi.string()
    .valid("css", "scss", "js", "jsx", "ts", "tsx", "html", "mdx")
    .default("css"),
  code: Joi.string().min(10).max(8000).required(),
  description: Joi.string().max(240).allow("", null),
  preview: Joi.string().uri().allow(null),
  props: Joi.object().unknown(true).default({}),
});

const componentSnippetsSchema = Joi.object()
  .pattern(/^[a-zA-Z0-9_-]+$/, componentSnippetSchema)
  .default({});

const templateCatalogCreateSchema = Joi.object({
  slug: templateSlug.required(),
  name: Joi.string().max(120).required(),
  description: Joi.string().max(400).allow("", null),
  previewUrl: Joi.string().uri().required(),
  isActive: Joi.boolean().default(true),
  themeConfig: themeConfigSchema,
  componentSnippets: componentSnippetsSchema,
});

const templateCatalogUpdateSchema = Joi.object({
  name: Joi.string().max(120),
  description: Joi.string().max(400).allow("", null),
  previewUrl: Joi.string().uri(),
  isActive: Joi.boolean(),
  themeConfig: themeConfigSchema,
  componentSnippets: componentSnippetsSchema,
}).min(1);

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
export const validateAdminRegister = (payload) =>
  adminRegisterSchema.validateAsync(payload, baseOptions);
export const validateAdminUpgrade = (payload) =>
  adminUpgradeSchema.validateAsync(payload, baseOptions);
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
export const validateTemplateCatalogCreate = (payload) =>
  templateCatalogCreateSchema.validateAsync(payload, baseOptions);
export const validateTemplateCatalogUpdate = (payload) =>
  templateCatalogUpdateSchema.validateAsync(payload, baseOptions);

export const validateSlug = async (value) =>
  slug.validateAsync(value, baseOptions);

// ========== NEW ENDPOINT VALIDATORS ==========

const forgotPasswordSchema = Joi.object({
  email: email.required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(20).max(256).required(),
  newPassword: password.required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: password.required(),
  newPassword: password.required(),
});

const userSettingsSchema = Joi.object({
  theme: Joi.string().valid("light", "dark", "system").default("system"),
  language: Joi.string().max(10).default("en"),
  timezone: Joi.string().max(64).default("UTC"),
});

const notificationPrefsSchema = Joi.object({
  email: Joi.boolean().default(true),
  push: Joi.boolean().default(false),
  marketing: Joi.boolean().default(false),
});

const privacyPrefsSchema = Joi.object({
  profile_public: Joi.boolean().default(true),
  show_email: Joi.boolean().default(false),
  allow_indexing: Joi.boolean().default(true),
});

const linkSchema = Joi.object({
  label: Joi.string().max(80).required(),
  url: Joi.string().uri().required(),
});

const socialLinkSchema = Joi.object({
  platform: Joi.string().max(40).required(),
  url: Joi.string().uri().required(),
});

const testimonialSchema = Joi.object({
  authorName: Joi.string().max(120).required(),
  authorTitle: Joi.string().max(120).allow("", null),
  authorCompany: Joi.string().max(120).allow("", null),
  authorAvatarUrl: Joi.string().uri().allow("", null),
  content: Joi.string().min(10).max(2000).required(),
  rating: Joi.number().integer().min(1).max(5).allow(null),
  isPublic: Joi.boolean().default(true),
});

const testimonialRequestSchema = Joi.object({
  recipientEmail: email.required(),
  recipientName: Joi.string().max(120).allow("", null),
  message: Joi.string().max(1000).allow("", null),
});

const reorderSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const announcementSchema = Joi.object({
  title: Joi.string().max(160).required(),
  body: Joi.string().max(4000).required(),
  target: Joi.string().valid("all", "free", "growth", "scale").default("all"),
});

const importPortfolioSchema = Joi.object({
  profile: profileSchema.optional(),
  experiences: Joi.array().items(experienceEntry).default([]),
  education: Joi.array().items(educationEntry).default([]),
  projects: Joi.array().items(projectEntry).default([]),
  skills: Joi.array().items(skillEntry).default([]),
  certifications: Joi.array().items(certificationEntry).default([]),
});

export const validateForgotPassword = (payload) =>
  forgotPasswordSchema.validateAsync(payload, baseOptions);
export const validateResetPassword = (payload) =>
  resetPasswordSchema.validateAsync(payload, baseOptions);
export const validateChangePassword = (payload) =>
  changePasswordSchema.validateAsync(payload, baseOptions);
export const validateSettings = (payload) =>
  userSettingsSchema.validateAsync(payload, baseOptions);
export const validateNotificationPrefs = (payload) =>
  notificationPrefsSchema.validateAsync(payload, baseOptions);
export const validatePrivacyPrefs = (payload) =>
  privacyPrefsSchema.validateAsync(payload, baseOptions);
export const validateLink = (payload) =>
  linkSchema.validateAsync(payload, baseOptions);
export const validateSocialLink = (payload) =>
  socialLinkSchema.validateAsync(payload, baseOptions);
export const validateTestimonial = (payload) =>
  testimonialSchema.validateAsync(payload, baseOptions);
export const validateTestimonialRequest = (payload) =>
  testimonialRequestSchema.validateAsync(payload, baseOptions);
export const validateReorder = (payload) =>
  reorderSchema.validateAsync(payload, baseOptions);
export const validateAnnouncement = (payload) =>
  announcementSchema.validateAsync(payload, baseOptions);
export const validateImportPortfolio = (payload) =>
  importPortfolioSchema.validateAsync(payload, baseOptions);
export const validateExperienceFull = (payload) =>
  experienceEntry.validateAsync(payload, baseOptions);
export const validateEducationFull = (payload) =>
  educationEntry.validateAsync(payload, baseOptions);
export const validateProjectFull = (payload) =>
  projectEntry.validateAsync(payload, baseOptions);
export const validateSkill = (payload) =>
  skillEntry.validateAsync(payload, baseOptions);
export const validateCertificationFull = (payload) =>
  certificationEntry.validateAsync(payload, baseOptions);

export const PORTFOLIO_REQUIREMENTS = [
  {
    key: "profile.headline",
    label: "Profile headline",
    description: "Add a punchy headline to anchor the hero section.",
  },
  {
    key: "profile.bio",
    label: "Summary / bio",
    description: "Provide a short narrative or summary about the person.",
  },
  {
    key: "skills",
    label: "Skills",
    description: "List at least three core skills to highlight strengths.",
    minItems: 3,
  },
  {
    key: "experiences",
    label: "Experience entries",
    description:
      "Include at least one experience entry to showcase work history.",
    minItems: 1,
  },
  {
    key: "projects",
    label: "Project or case studies",
    description:
      "Add at least one project or case study to make the portfolio tangible.",
    minItems: 1,
  },
];

export const getPortfolioBaseUrl = () =>
  process.env.PORTFOLIO_BASE_URL ||
  process.env.CORS_ORIGIN ||
  "http://localhost:3000";

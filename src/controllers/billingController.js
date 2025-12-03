import { PLAN_DEFINITIONS } from "../config/plans.js";

export const PLANS = [
  {
    ...PLAN_DEFINITIONS.free,
    features: [
      "1 dashboard",
      "Manual editing",
      "Private Vultr storage",
      "Manual profile sections",
    ],
  },
  {
    ...PLAN_DEFINITIONS.growth,
    features: [
      "5 dashboards",
      "Resume AI extraction",
      "Priority signed URLs",
      "Template switching",
    ],
  },
  {
    ...PLAN_DEFINITIONS.scale,
    features: [
      "Unlimited dashboards",
      "Advanced Gemini agent",
      "Custom branding",
      "Admin-ready controls",
    ],
  },
];

export const getPlans = (req, res) => res.json({ plans: PLANS });

export const PLAN_DEFINITIONS = {
  free: {
    tier: "free",
    name: "Free",
    priceInr: 0,
    dashboardLimit: 1,
    storageLimitMb: 250,
    description: "Single dashboard, manual edits, essential storage.",
  },
  growth: {
    tier: "growth",
    name: "Growth 149",
    priceInr: 149,
    dashboardLimit: 5,
    storageLimitMb: 1024,
    description: "Up to five dashboards plus AI resume analysis.",
  },
  scale: {
    tier: "scale",
    name: "Scale 250",
    priceInr: 250,
    dashboardLimit: null,
    storageLimitMb: 5120,
    description: "Unlimited dashboards, premium AI tooling, concierge support.",
  },
};

export const getPlanDefinition = (tier = "free") =>
  PLAN_DEFINITIONS[tier] || PLAN_DEFINITIONS.free;

export const canCreateDashboard = (tier, existingCount, options = {}) => {
  if (options.isAdmin) {
    return true;
  }
  const plan = getPlanDefinition(tier);
  if (!plan.dashboardLimit) return true;
  return existingCount < plan.dashboardLimit;
};

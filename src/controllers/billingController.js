import pool from "../config/db.js";
import {
  PLAN_DEFINITIONS,
  getPlanDefinition,
  getAllPlans,
} from "../config/plans.js";

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

// --- Get Current Subscription ---
export const getCurrentSubscription = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT us.*, p.name as plan_name, p.features
       FROM user_subscriptions us
       LEFT JOIN plans p ON p.tier = us.plan_tier
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (!result.rowCount) {
      return res.json({ subscription: null });
    }

    return res.json({ subscription: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

// --- Get Billing History ---
export const getBillingHistory = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT us.id, us.plan_tier, us.price_inr, us.status, us.created_at, us.metadata,
              p.name as plan_name
       FROM user_subscriptions us
       LEFT JOIN plans p ON p.tier = us.plan_tier
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    return res.json({ history: result.rows });
  } catch (error) {
    return next(error);
  }
};

// --- Upgrade Plan ---
export const upgradePlan = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { planTier, paymentMethod } = req.body;

    if (!planTier) {
      res.status(400);
      throw new Error("Plan tier is required.");
    }

    const plan = getPlanDefinition(planTier);
    if (!plan) {
      res.status(400);
      throw new Error("Invalid plan tier.");
    }

    const currentSub = await pool.query(
      `SELECT plan FROM users WHERE id = $1`,
      [req.user.id]
    );
    const currentTier = currentSub.rows[0]?.plan || "free";

    const tierOrder = {
      free: 0,
      starter: 1,
      growth: 2,
      creator: 3,
      pro: 4,
      scale: 5,
    };
    if (tierOrder[planTier] <= tierOrder[currentTier]) {
      res.status(400);
      throw new Error("Can only upgrade to a higher plan.");
    }

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO user_subscriptions (user_id, plan_tier, price_inr, status, metadata)
       VALUES ($1, $2, $3, 'active', $4)`,
      [
        req.user.id,
        plan.tier,
        plan.priceInr,
        JSON.stringify({ paymentMethod, upgradeFrom: currentTier }),
      ]
    );

    await client.query(
      `UPDATE users SET plan = $1, plan_updated_at = NOW() WHERE id = $2`,
      [plan.tier, req.user.id]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Plan upgraded successfully.",
      newPlan: plan.tier,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

// --- Cancel Subscription ---
export const cancelSubscription = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { reason } = req.body;

    await client.query("BEGIN");

    await client.query(
      `UPDATE user_subscriptions 
       SET status = 'cancelled', metadata = COALESCE(metadata, '{}'::jsonb) || $1
       WHERE user_id = $2 AND status = 'active'`,
      [
        JSON.stringify({
          cancelReason: reason,
          cancelledAt: new Date().toISOString(),
        }),
        req.user.id,
      ]
    );

    await client.query(
      `UPDATE users SET plan = 'free', plan_updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    );

    await client.query(
      `INSERT INTO user_subscriptions (user_id, plan_tier, price_inr, status)
       VALUES ($1, 'free', 0, 'active')`,
      [req.user.id]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Subscription cancelled. Downgraded to free plan.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

// --- Get Invoice ---
export const getInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT us.*, p.name as plan_name, u.name as user_name, u.email
       FROM user_subscriptions us
       JOIN users u ON u.id = us.user_id
       LEFT JOIN plans p ON p.tier = us.plan_tier
       WHERE us.id = $1 AND us.user_id = $2`,
      [id, req.user.id]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("Invoice not found.");
    }

    const sub = result.rows[0];

    const invoice = {
      id: sub.id,
      invoiceNumber: `INV-${sub.id.toString().padStart(6, "0")}`,
      date: sub.created_at,
      customer: {
        name: sub.user_name,
        email: sub.email,
      },
      items: [
        {
          description: `${sub.plan_name} Plan Subscription`,
          amount: sub.price_inr,
        },
      ],
      total: sub.price_inr,
      currency: "INR",
      status: sub.status,
    };

    return res.json({ invoice });
  } catch (error) {
    return next(error);
  }
};

// --- Payment Webhook ---
export const paymentWebhook = async (req, res, next) => {
  try {
    const { event, data } = req.body;
    console.log("Payment webhook received:", event);

    switch (event) {
      case "payment.success":
        break;
      case "payment.failed":
        break;
      case "subscription.cancelled":
        break;
      default:
        console.log("Unhandled event:", event);
    }

    return res.json({ received: true });
  } catch (error) {
    return next(error);
  }
};

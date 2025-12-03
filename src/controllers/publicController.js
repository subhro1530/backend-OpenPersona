import pool from "../config/db.js";
import { PLANS } from "./billingController.js";

const selectProfile = `SELECT u.id, u.name, u.handle, u.plan,
  pl.name AS plan_name, pl.price_inr,
  p.headline, p.bio, p.template,
  p.avatar_url, p.banner_url
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  LEFT JOIN plans pl ON pl.tier = u.plan
  WHERE u.handle = $1 OR u.id::text = $1
  LIMIT 1`;

export const getPublicProfile = async (req, res, next) => {
  try {
    const profileResult = await pool.query(selectProfile, [req.params.uid]);

    if (!profileResult.rowCount) {
      res.status(404);
      throw new Error("Profile not found.");
    }

    const dashboards = await pool.query(
      `SELECT id, title, slug, layout, updated_at
       FROM dashboards WHERE user_id = $1 AND visibility = 'public'
       ORDER BY updated_at DESC`,
      [profileResult.rows[0].id]
    );

    return res.json({
      profile: profileResult.rows[0],
      dashboards: dashboards.rows,
    });
  } catch (error) {
    return next(error);
  }
};

export const getPublicPlan = async (req, res, next) => {
  try {
    const planKey = req.params.plan.toLowerCase();
    const plan = PLANS.find((p) => p.tier === planKey);
    if (!plan) {
      res.status(404);
      throw new Error("Plan not found.");
    }

    const profileResult = await pool.query(selectProfile, [req.params.uid]);
    if (!profileResult.rowCount) {
      res.status(404);
      throw new Error("Profile not found.");
    }

    return res.json({ profile: profileResult.rows[0], plan });
  } catch (error) {
    return next(error);
  }
};

export const getPublicDashboardBySlug = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.title, d.slug, d.layout, d.updated_at,
              u.id AS user_id, u.handle, u.name
       FROM dashboards d
       JOIN users u ON u.id = d.user_id
       WHERE (u.id::text = $1 OR u.handle = $1)
         AND d.slug = $2
         AND d.visibility <> 'private'
       LIMIT 1`,
      [req.params.uid, req.params.slug]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("Dashboard not found or not public.");
    }

    return res.json({ dashboard: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

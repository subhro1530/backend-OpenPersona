import pool from "../config/db.js";
import { validatePlanChange, validateAdminBlock } from "../utils/validators.js";
import { PLAN_DEFINITIONS } from "../config/plans.js";

export const listUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, handle, plan, is_admin, is_blocked,
              plan_updated_at, created_at
       FROM users ORDER BY created_at DESC`
    );
    return res.json({ users: result.rows });
  } catch (error) {
    return next(error);
  }
};

export const updateUserPlan = async (req, res, next) => {
  try {
    const payload = await validatePlanChange(req.body);
    const plan = PLAN_DEFINITIONS[payload.plan];
    if (!plan) {
      res.status(400);
      throw new Error("Unknown plan tier.");
    }

    const result = await pool.query(
      `UPDATE users SET plan = $1, plan_updated_at = NOW() WHERE id = $2
       RETURNING id, name, email, handle, plan, plan_updated_at`,
      [plan.tier, req.params.id]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("User not found.");
    }

    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_tier, price_inr, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        req.params.id,
        plan.tier,
        plan.priceInr,
        JSON.stringify({ changedBy: req.user.id }),
      ]
    );

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const setBlockStatus = async (req, res, next) => {
  try {
    const payload = await validateAdminBlock(req.body);
    const result = await pool.query(
      `UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, name, handle, is_blocked`,
      [payload.blocked, req.params.id]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("User not found.");
    }

    await pool.query(
      `INSERT INTO admin_actions (admin_id, target_user, action, reason)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user.id,
        req.params.id,
        payload.blocked ? "block" : "unblock",
        payload.reason,
      ]
    );

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("User not found.");
    }

    await pool.query(
      `INSERT INTO admin_actions (admin_id, target_user, action)
       VALUES ($1, $2, 'delete')`,
      [req.user.id, req.params.id]
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

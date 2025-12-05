import pool from "../config/db.js";
import slugify from "slugify";
import {
  validateDashboardCreate,
  validateDashboardUpdate,
} from "../utils/validators.js";
import { canCreateDashboard } from "../config/plans.js";

const toSlug = (value, title) => {
  if (value) return value.toLowerCase();
  const generated = slugify(title, { lower: true, strict: true });
  return generated || `dashboard-${Date.now()}`;
};

export const listDashboards = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, slug, visibility, layout, created_at, updated_at
       FROM dashboards WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ dashboards: result.rows });
  } catch (error) {
    return next(error);
  }
};

export const createDashboard = async (req, res, next) => {
  try {
    const payload = await validateDashboardCreate(req.body);
    const dashboardStats = await pool.query(
      `SELECT COUNT(*)::int AS count,
              COALESCE(bool_or(is_primary), FALSE) AS has_primary
         FROM dashboards WHERE user_id = $1`,
      [req.user.id]
    );

    const { count, has_primary } = dashboardStats.rows[0];
    if (
      !canCreateDashboard(req.user.plan, count, { isAdmin: req.user.isAdmin })
    ) {
      res.status(403);
      throw new Error("Plan limit reached. Upgrade to add more dashboards.");
    }

    const shouldBePrimary = !has_primary;

    const desiredSlug = toSlug(payload.slug, payload.title);

    const slugCheck = await pool.query(
      "SELECT id FROM dashboards WHERE user_id = $1 AND slug = $2",
      [req.user.id, desiredSlug]
    );

    if (slugCheck.rowCount) {
      res.status(409);
      throw new Error("Dashboard slug already exists.");
    }

    const result = await pool.query(
      `INSERT INTO dashboards (user_id, title, slug, visibility, layout, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, slug, visibility, layout, is_primary, created_at`,
      [
        req.user.id,
        payload.title,
        desiredSlug,
        payload.visibility,
        payload.layout,
        shouldBePrimary,
      ]
    );

    return res.status(201).json({ dashboard: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

const getDashboardById = async (id, userId) => {
  const result = await pool.query(
    `SELECT * FROM dashboards WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
};

export const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await getDashboardById(req.params.id, req.user.id);
    if (!dashboard) {
      res.status(404);
      throw new Error("Dashboard not found.");
    }
    return res.json({ dashboard });
  } catch (error) {
    return next(error);
  }
};

export const updateDashboard = async (req, res, next) => {
  try {
    const payload = await validateDashboardUpdate(req.body);
    const dashboard = await getDashboardById(req.params.id, req.user.id);

    if (!dashboard) {
      res.status(404);
      throw new Error("Dashboard not found.");
    }

    if (payload.slug && payload.slug !== dashboard.slug) {
      const slugCheck = await pool.query(
        "SELECT id FROM dashboards WHERE user_id = $1 AND slug = $2 AND id <> $3",
        [req.user.id, payload.slug, req.params.id]
      );
      if (slugCheck.rowCount) {
        res.status(409);
        throw new Error("Dashboard slug already exists.");
      }
    }

    const merged = {
      title: payload.title ?? dashboard.title,
      slug: payload.slug ?? dashboard.slug,
      visibility: payload.visibility ?? dashboard.visibility,
      layout: payload.layout ?? dashboard.layout,
    };

    const result = await pool.query(
      `UPDATE dashboards SET title = $1, slug = $2, visibility = $3, layout = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, title, slug, visibility, layout, updated_at`,
      [
        merged.title,
        merged.slug,
        merged.visibility,
        merged.layout,
        req.params.id,
      ]
    );

    return res.json({ dashboard: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const deleteDashboard = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const dashboardResult = await client.query(
      `SELECT id, is_primary FROM dashboards
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
      [req.params.id, req.user.id]
    );

    if (!dashboardResult.rowCount) {
      res.status(404);
      throw new Error("Dashboard not found.");
    }

    await client.query("DELETE FROM dashboards WHERE id = $1", [req.params.id]);

    if (dashboardResult.rows[0].is_primary) {
      const replacement = await client.query(
        `SELECT id FROM dashboards
           WHERE user_id = $1
           ORDER BY updated_at DESC NULLS LAST, created_at DESC
           LIMIT 1`,
        [req.user.id]
      );

      if (replacement.rowCount) {
        await client.query(
          "UPDATE dashboards SET is_primary = TRUE WHERE id = $1",
          [replacement.rows[0].id]
        );
      }
    }

    await client.query("COMMIT");
    return res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

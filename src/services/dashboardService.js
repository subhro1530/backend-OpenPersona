import pool from "../config/db.js";
import crypto from "crypto";

// ========== DASHBOARD ANALYTICS ==========
export const recordDashboardEvent = async (
  dashboardId,
  eventType,
  meta = {}
) => {
  await pool.query(
    `INSERT INTO dashboard_events (dashboard_id, event_type, referrer, user_agent, ip_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      dashboardId,
      eventType,
      meta.referrer || null,
      meta.userAgent || null,
      meta.ipHash || null,
    ]
  );
};

export const getDashboardAnalytics = async (dashboardId) => {
  const views = await pool.query(
    `SELECT COUNT(*) AS count FROM dashboard_events WHERE dashboard_id = $1 AND event_type = 'view'`,
    [dashboardId]
  );
  const clicks = await pool.query(
    `SELECT COUNT(*) AS count FROM dashboard_events WHERE dashboard_id = $1 AND event_type = 'click'`,
    [dashboardId]
  );
  const shares = await pool.query(
    `SELECT COUNT(*) AS count FROM dashboard_events WHERE dashboard_id = $1 AND event_type = 'share'`,
    [dashboardId]
  );
  return {
    views: Number(views.rows[0].count),
    clicks: Number(clicks.rows[0].count),
    shares: Number(shares.rows[0].count),
  };
};

// Alias for controller compatibility
export const getAnalytics = async (dashboardId, period = "7d") => {
  // Calculate date range based on period
  let days = 7;
  if (period === "30d") days = 30;
  else if (period === "90d") days = 90;
  else if (period === "1y") days = 365;

  const views = await pool.query(
    `SELECT COUNT(*) AS count FROM dashboard_events 
     WHERE dashboard_id = $1 AND event_type = 'view' 
     AND created_at >= NOW() - INTERVAL '${days} days'`,
    [dashboardId]
  );
  const clicks = await pool.query(
    `SELECT COUNT(*) AS count FROM dashboard_events 
     WHERE dashboard_id = $1 AND event_type = 'click'
     AND created_at >= NOW() - INTERVAL '${days} days'`,
    [dashboardId]
  );
  const shares = await pool.query(
    `SELECT COUNT(*) AS count FROM dashboard_events 
     WHERE dashboard_id = $1 AND event_type = 'share'
     AND created_at >= NOW() - INTERVAL '${days} days'`,
    [dashboardId]
  );
  return {
    views: Number(views.rows[0].count),
    clicks: Number(clicks.rows[0].count),
    shares: Number(shares.rows[0].count),
  };
};

// ========== SHARE TOKEN ==========
export const generateShareToken = async (dashboardId) => {
  const token = crypto.randomBytes(16).toString("hex");
  await pool.query(`UPDATE dashboards SET share_token = $1 WHERE id = $2`, [
    token,
    dashboardId,
  ]);
  return token;
};

// ========== SHARE LINKS ==========
export const createShareLink = async (dashboardId, options = {}) => {
  const token = crypto.randomBytes(16).toString("hex");
  const { expiresIn, maxViews } = options;
  let expiresAt = null;
  if (expiresIn) {
    expiresAt = new Date(Date.now() + expiresIn * 1000);
  }
  const result = await pool.query(
    `INSERT INTO dashboard_shares (dashboard_id, token, expires_at, max_views)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [dashboardId, token, expiresAt, maxViews || null]
  );
  return result.rows[0];
};

export const getShareByToken = async (token) => {
  const result = await pool.query(
    `SELECT * FROM dashboard_shares 
     WHERE token = $1 
     AND (expires_at IS NULL OR expires_at > NOW())
     AND (max_views IS NULL OR view_count < max_views)`,
    [token]
  );
  return result.rows[0] || null;
};

export const revokeShareLink = async (shareId) => {
  const result = await pool.query(
    `DELETE FROM dashboard_shares WHERE id = $1 RETURNING id`,
    [shareId]
  );
  return result.rowCount > 0;
};

// ========== DUPLICATE DASHBOARD ==========
export const duplicateDashboard = async (userId, dashboardId) => {
  const original = await pool.query(
    `SELECT title, slug, visibility, layout FROM dashboards WHERE id = $1 AND user_id = $2`,
    [dashboardId, userId]
  );
  if (!original.rowCount) return null;
  const { title, visibility, layout } = original.rows[0];
  const newSlug = `${original.rows[0].slug}-copy-${Date.now()}`;
  const result = await pool.query(
    `INSERT INTO dashboards (user_id, title, slug, visibility, layout)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, `${title} (Copy)`, newSlug, visibility, layout]
  );
  return result.rows[0];
};

// ========== REORDER DASHBOARDS ==========
export const reorderDashboards = async (userId, ids) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < ids.length; i++) {
      await client.query(
        `UPDATE dashboards SET position = $1 WHERE id = $2 AND user_id = $3`,
        [i, ids[i], userId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ========== TOGGLE VISIBILITY ==========
export const toggleVisibility = async (userId, dashboardId, visibility) => {
  const result = await pool.query(
    `UPDATE dashboards SET visibility = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id, visibility`,
    [visibility, dashboardId, userId]
  );
  return result.rows[0] || null;
};

import {
  recordDashboardEvent,
  getAnalytics,
  createShareLink,
  getShareByToken,
  revokeShareLink,
  duplicateDashboard,
  reorderDashboards,
} from "../services/dashboardService.js";
import pool from "../config/db.js";

// --- Record Dashboard View (public) ---
export const trackDashboardView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const referrer = req.headers.referer || req.headers.referrer || null;
    await recordDashboardEvent(id, "view", {
      ip: ipAddress,
      userAgent,
      referrer,
    });
    return res.json({ tracked: true });
  } catch (error) {
    return next(error);
  }
};

// --- Record Dashboard Link Click (public) ---
export const trackLinkClick = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { linkId, linkUrl } = req.body;
    await recordDashboardEvent(id, "click", { linkId, linkUrl });
    return res.json({ tracked: true });
  } catch (error) {
    return next(error);
  }
};

// --- Get Dashboard Analytics (owner only) ---
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = "7d" } = req.query;
    // Verify ownership
    const dashboard = await pool.query(
      `SELECT id FROM dashboards WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!dashboard.rowCount) {
      res.status(404);
      throw new Error("Dashboard not found.");
    }
    const analytics = await getAnalytics(id, period);
    return res.json({ analytics });
  } catch (error) {
    return next(error);
  }
};

// --- Get Overall Analytics (all dashboards) ---
export const getOverallAnalytics = async (req, res, next) => {
  try {
    const { period = "7d" } = req.query;
    const dashboards = await pool.query(
      `SELECT id FROM dashboards WHERE user_id = $1`,
      [req.user.id]
    );
    const dashboardIds = dashboards.rows.map((d) => d.id);
    if (!dashboardIds.length) {
      return res.json({
        analytics: { views: 0, clicks: 0, shares: 0, byDashboard: [] },
      });
    }
    const allAnalytics = await Promise.all(
      dashboardIds.map((id) => getAnalytics(id, period))
    );
    const totals = allAnalytics.reduce(
      (acc, a) => ({
        views: acc.views + a.views,
        clicks: acc.clicks + a.clicks,
        shares: acc.shares + a.shares,
      }),
      { views: 0, clicks: 0, shares: 0 }
    );
    return res.json({
      analytics: {
        ...totals,
        byDashboard: dashboardIds.map((id, i) => ({
          dashboardId: id,
          ...allAnalytics[i],
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// --- Create Share Link ---
export const createDashboardShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expiresIn, maxViews } = req.body;
    // Verify ownership
    const dashboard = await pool.query(
      `SELECT id FROM dashboards WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!dashboard.rowCount) {
      res.status(404);
      throw new Error("Dashboard not found.");
    }
    const share = await createShareLink(id, { expiresIn, maxViews });
    const baseUrl =
      process.env.FRONTEND_URL ||
      req.headers.origin ||
      `${req.protocol}://${req.get("host")}`;
    return res.status(201).json({
      share,
      shareUrl: `${baseUrl}/s/${share.token}`,
    });
  } catch (error) {
    return next(error);
  }
};

// --- Get Dashboard by Share Token (public) ---
export const getDashboardByShareToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const share = await getShareByToken(token);
    if (!share) {
      res.status(404);
      throw new Error("Share link not found or expired.");
    }
    // Increment view count
    await pool.query(
      `UPDATE dashboard_shares SET view_count = view_count + 1 WHERE id = $1`,
      [share.id]
    );
    // Fetch dashboard data
    const dashboard = await pool.query(
      `SELECT d.*, u.name as owner_name, u.handle as owner_handle
       FROM dashboards d
       JOIN users u ON u.id = d.user_id
       WHERE d.id = $1`,
      [share.dashboard_id]
    );
    if (!dashboard.rowCount) {
      res.status(404);
      throw new Error("Dashboard not found.");
    }
    return res.json({ dashboard: dashboard.rows[0] });
  } catch (error) {
    return next(error);
  }
};

// --- Revoke Share Link ---
export const revokeDashboardShareLink = async (req, res, next) => {
  try {
    const { id, shareId } = req.params;
    // Verify ownership
    const dashboard = await pool.query(
      `SELECT id FROM dashboards WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!dashboard.rowCount) {
      res.status(404);
      throw new Error("Dashboard not found.");
    }
    const revoked = await revokeShareLink(shareId);
    if (!revoked) {
      res.status(404);
      throw new Error("Share link not found.");
    }
    return res.json({ message: "Share link revoked." });
  } catch (error) {
    return next(error);
  }
};

// --- Duplicate Dashboard ---
export const duplicateUserDashboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newSlug } = req.body;
    // Verify ownership
    const dashboard = await pool.query(
      `SELECT id FROM dashboards WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!dashboard.rowCount) {
      res.status(404);
      throw new Error("Dashboard not found.");
    }
    const newDashboard = await duplicateDashboard(id, req.user.id, newSlug);
    return res.status(201).json({ dashboard: newDashboard });
  } catch (error) {
    return next(error);
  }
};

// --- Reorder Dashboards ---
export const reorderUserDashboards = async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      res.status(400);
      throw new Error("Order must be an array of dashboard IDs.");
    }
    await reorderDashboards(req.user.id, order);
    return res.json({ message: "Dashboards reordered successfully." });
  } catch (error) {
    return next(error);
  }
};

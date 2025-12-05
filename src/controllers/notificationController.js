import pool from "../config/db.js";

// --- List Notifications ---
export const listNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, limit = 50, offset = 0 } = req.query;
    let query = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [req.user.id];

    if (unreadOnly === "true") {
      query += ` AND read_at IS NULL`;
    }
    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE read_at IS NULL) as unread
       FROM notifications WHERE user_id = $1`,
      [req.user.id]
    );

    return res.json({
      notifications: result.rows,
      total: parseInt(countResult.rows[0].total),
      unread: parseInt(countResult.rows[0].unread),
    });
  } catch (error) {
    return next(error);
  }
};

// --- Mark Notification as Read ---
export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.user.id]
    );
    if (!result.rowCount) {
      res.status(404);
      throw new Error("Notification not found.");
    }
    return res.json({ notification: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

// --- Mark All Notifications as Read ---
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    return res.json({ message: "All notifications marked as read." });
  } catch (error) {
    return next(error);
  }
};

// --- Delete Notification ---
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user.id]
    );
    if (!result.rowCount) {
      res.status(404);
      throw new Error("Notification not found.");
    }
    return res.json({ message: "Notification deleted." });
  } catch (error) {
    return next(error);
  }
};

// --- Clear All Notifications ---
export const clearAllNotifications = async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [
      req.user.id,
    ]);
    return res.json({ message: "All notifications cleared." });
  } catch (error) {
    return next(error);
  }
};

// --- Create Notification (internal helper, also exported for admin use) ---
export const createNotification = async (
  userId,
  type,
  title,
  message,
  metadata = null
) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
  );
  return result.rows[0];
};

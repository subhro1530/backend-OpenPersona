import pool from "../config/db.js";

// ========== USER SETTINGS ==========
export const getSettings = async (userId) => {
  let result = await pool.query(
    `SELECT theme, language, timezone, notifications, privacy, updated_at
       FROM user_settings WHERE user_id = $1`,
    [userId]
  );
  if (!result.rowCount) {
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [userId]
    );
    result = await pool.query(
      `SELECT theme, language, timezone, notifications, privacy, updated_at
         FROM user_settings WHERE user_id = $1`,
      [userId]
    );
  }
  return result.rows[0];
};

export const updateSettings = async (userId, payload) => {
  await pool.query(
    `INSERT INTO user_settings (user_id, theme, language, timezone, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       theme = COALESCE($2, user_settings.theme),
       language = COALESCE($3, user_settings.language),
       timezone = COALESCE($4, user_settings.timezone),
       updated_at = NOW()`,
    [userId, payload.theme, payload.language, payload.timezone]
  );
  return getSettings(userId);
};

export const updateNotificationPrefs = async (userId, prefs) => {
  await pool.query(
    `UPDATE user_settings SET notifications = $1::jsonb, updated_at = NOW() WHERE user_id = $2`,
    [JSON.stringify(prefs), userId]
  );
  return getSettings(userId);
};

export const updatePrivacyPrefs = async (userId, prefs) => {
  await pool.query(
    `UPDATE user_settings SET privacy = $1::jsonb, updated_at = NOW() WHERE user_id = $2`,
    [JSON.stringify(prefs), userId]
  );
  return getSettings(userId);
};

export const deleteAccount = async (userId) => {
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
};

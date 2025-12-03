import pool from "../config/db.js";

export const listTemplates = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT slug, name, description, preview_url, is_active
       FROM templates
       WHERE is_active = TRUE
       ORDER BY name`
    );

    return res.json({ templates: result.rows });
  } catch (error) {
    return next(error);
  }
};

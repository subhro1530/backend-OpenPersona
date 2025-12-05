import pool from "../config/db.js";

// --- Search Public Profiles ---
export const searchProfiles = async (req, res, next) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ profiles: [], total: 0 });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    const result = await pool.query(
      `SELECT u.id, u.name, u.handle, p.headline, p.avatar_url, p.template
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.is_blocked = FALSE
         AND (
           LOWER(u.name) LIKE $1
           OR LOWER(u.handle) LIKE $1
           OR LOWER(p.headline) LIKE $1
         )
       ORDER BY u.name
       LIMIT $2 OFFSET $3`,
      [searchTerm, parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.is_blocked = FALSE
         AND (
           LOWER(u.name) LIKE $1
           OR LOWER(u.handle) LIKE $1
           OR LOWER(p.headline) LIKE $1
         )`,
      [searchTerm]
    );

    return res.json({
      profiles: result.rows,
      total: parseInt(countResult.rows[0].total),
    });
  } catch (error) {
    return next(error);
  }
};

// --- Search User's Own Content ---
export const searchUserContent = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ results: [] });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;
    const userId = req.user.id;
    const results = [];

    // Search projects
    if (!type || type === "projects") {
      const projects = await pool.query(
        `SELECT p.id, p.title, p.description, 'project' as type
         FROM projects p
         JOIN dashboards d ON d.id = p.dashboard_id
         WHERE d.user_id = $1
           AND (LOWER(p.title) LIKE $2 OR LOWER(p.description) LIKE $2)
         LIMIT 10`,
        [userId, searchTerm]
      );
      results.push(...projects.rows);
    }

    // Search links
    if (!type || type === "links") {
      const links = await pool.query(
        `SELECT l.id, l.title, l.url, 'link' as type
         FROM links l
         JOIN dashboards d ON d.id = l.dashboard_id
         WHERE d.user_id = $1
           AND LOWER(l.title) LIKE $2
         LIMIT 10`,
        [userId, searchTerm]
      );
      results.push(...links.rows);
    }

    // Search experience
    if (!type || type === "experience") {
      const experience = await pool.query(
        `SELECT id, company, title, 'experience' as type
         FROM experience
         WHERE user_id = $1
           AND (LOWER(company) LIKE $2 OR LOWER(title) LIKE $2 OR LOWER(description) LIKE $2)
         LIMIT 10`,
        [userId, searchTerm]
      );
      results.push(...experience.rows);
    }

    // Search education
    if (!type || type === "education") {
      const education = await pool.query(
        `SELECT id, institution, degree, 'education' as type
         FROM education
         WHERE user_id = $1
           AND (LOWER(institution) LIKE $2 OR LOWER(degree) LIKE $2 OR LOWER(field_of_study) LIKE $2)
         LIMIT 10`,
        [userId, searchTerm]
      );
      results.push(...education.rows);
    }

    // Search skills
    if (!type || type === "skills") {
      const skills = await pool.query(
        `SELECT id, name, category, 'skill' as type
         FROM skills
         WHERE user_id = $1
           AND (LOWER(name) LIKE $2 OR LOWER(category) LIKE $2)
         LIMIT 10`,
        [userId, searchTerm]
      );
      results.push(...skills.rows);
    }

    return res.json({ results });
  } catch (error) {
    return next(error);
  }
};

// --- Global Search (Admin) ---
export const adminGlobalSearch = async (req, res, next) => {
  try {
    if (!req.user.is_admin) {
      res.status(403);
      throw new Error("Admin access required.");
    }

    const { q, entity, limit = 50 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ results: [] });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;
    const results = {};

    // Search users
    if (!entity || entity === "users") {
      const users = await pool.query(
        `SELECT id, name, email, handle, plan, is_admin, is_blocked, created_at
         FROM users
         WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1 OR LOWER(handle) LIKE $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [searchTerm, parseInt(limit)]
      );
      results.users = users.rows;
    }

    // Search dashboards
    if (!entity || entity === "dashboards") {
      const dashboards = await pool.query(
        `SELECT d.id, d.title, d.slug, d.user_id, u.name as owner_name
         FROM dashboards d
         JOIN users u ON u.id = d.user_id
         WHERE LOWER(d.title) LIKE $1 OR LOWER(d.slug) LIKE $1
         ORDER BY d.created_at DESC
         LIMIT $2`,
        [searchTerm, parseInt(limit)]
      );
      results.dashboards = dashboards.rows;
    }

    return res.json({ results });
  } catch (error) {
    return next(error);
  }
};

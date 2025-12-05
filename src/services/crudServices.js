import pool from "../config/db.js";

// ========== GENERIC CRUD HELPERS ==========
const crud = (table, columns, userIdCol = "user_id") => {
  const list = async (userId, dashboardId = null) => {
    let query = `SELECT * FROM ${table} WHERE ${userIdCol} = $1`;
    const params = [userId];
    if (dashboardId) {
      query += ` AND dashboard_id = $2`;
      params.push(dashboardId);
    }
    query += ` ORDER BY position ASC, created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  };

  const get = async (userId, id) => {
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE id = $1 AND ${userIdCol} = $2`,
      [id, userId]
    );
    return result.rows[0] || null;
  };

  const create = async (userId, data) => {
    const keys = Object.keys(data);
    const vals = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 2}`).join(", ");
    const result = await pool.query(
      `INSERT INTO ${table} (${userIdCol}, ${keys.join(", ")})
       VALUES ($1, ${placeholders})
       RETURNING *`,
      [userId, ...vals]
    );
    return result.rows[0];
  };

  const update = async (userId, id, data) => {
    const keys = Object.keys(data);
    const vals = Object.values(data);
    const sets = keys.map((k, i) => `${k} = $${i + 3}`).join(", ");
    const result = await pool.query(
      `UPDATE ${table} SET ${sets} WHERE id = $1 AND ${userIdCol} = $2 RETURNING *`,
      [id, userId, ...vals]
    );
    return result.rows[0] || null;
  };

  const remove = async (userId, id) => {
    const result = await pool.query(
      `DELETE FROM ${table} WHERE id = $1 AND ${userIdCol} = $2 RETURNING id`,
      [id, userId]
    );
    return result.rowCount > 0;
  };

  const reorder = async (userId, dashboardIdOrIds, ids = null) => {
    const actualIds = ids || dashboardIdOrIds;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (let i = 0; i < actualIds.length; i++) {
        await client.query(
          `UPDATE ${table} SET position = $1 WHERE id = $2 AND ${userIdCol} = $3`,
          [i, actualIds[i], userId]
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

  return { list, get, create, update, delete: remove, reorder };
};

// ========== LINKS ==========
export const Links = crud("links", ["label", "url"]);

// ========== PROJECTS ==========
const projectsCrud = crud("projects", [
  "title",
  "description",
  "tags",
  "links",
  "media",
]);
export const Projects = {
  ...projectsCrud,
  addMedia: async (userId, projectId, mediaItem) => {
    const result = await pool.query(
      `UPDATE projects
         SET media = media || $1::jsonb
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [JSON.stringify([mediaItem]), projectId, userId]
    );
    return result.rows[0] || null;
  },
};

// ========== EXPERIENCES ==========
export const Experiences = crud("experiences", [
  "company",
  "role",
  "summary",
  "start_date",
  "end_date",
]);

// ========== EDUCATION ==========
export const Education = crud("education", [
  "institution",
  "degree",
  "summary",
  "start_date",
  "end_date",
]);

// ========== CERTIFICATIONS ==========
export const Certifications = crud("certifications", [
  "name",
  "issuer",
  "summary",
  "credential_id",
  "issued_at",
  "expires_at",
]);

// ========== SKILLS ==========
const skillsCrud = crud("skills", ["name", "level"]);
export const Skills = {
  ...skillsCrud,
  bulkCreate: async (userId, skills) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const skill of skills) {
        const r = await client.query(
          `INSERT INTO skills (user_id, name, level) VALUES ($1, $2, $3) RETURNING *`,
          [userId, skill.name, skill.level || null]
        );
        results.push(r.rows[0]);
      }
      await client.query("COMMIT");
      return results;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

// ========== SOCIAL LINKS ==========
export const SocialLinks = crud("social_links", ["platform", "url"]);

// ========== TESTIMONIALS ==========
export const Testimonials = crud("testimonials", [
  "author_name",
  "author_title",
  "author_company",
  "author_avatar_url",
  "content",
  "rating",
  "is_public",
]);

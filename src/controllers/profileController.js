import pool from "../config/db.js";
import {
  validateProfile,
  validateHandleUpdate,
  validateTemplateUpdate,
} from "../utils/validators.js";
import { ensureTemplateExists } from "../services/templateService.js";

export const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.handle,
              p.headline, p.bio, p.location, p.avatar_url, p.banner_url,
              p.template, COALESCE(p.social_links, '[]'::jsonb) AS social_links
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("Profile not found.");
    }

    return res.json({ profile: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const payload = await validateProfile(req.body);
    if (payload.template) {
      const normalized = payload.template.toLowerCase();
      await ensureTemplateExists(normalized);
      payload.template = normalized;
    }
    await pool.query(
      `UPDATE profiles SET
        headline = $1,
        bio = $2,
        location = $3,
        avatar_url = $4,
        banner_url = $5,
        template = COALESCE($6, template),
        social_links = $7::jsonb
       WHERE user_id = $8`,
      [
        payload.headline || null,
        payload.bio || null,
        payload.location || null,
        payload.avatarUrl || null,
        payload.bannerUrl || null,
        payload.template || null,
        JSON.stringify(payload.socialLinks || []),
        req.user.id,
      ]
    );

    return res.json({ message: "Profile updated." });
  } catch (error) {
    return next(error);
  }
};

export const updateHandle = async (req, res, next) => {
  try {
    const payload = await validateHandleUpdate(req.body);
    const handle = payload.handle.toLowerCase();

    const existing = await pool.query(
      "SELECT id FROM users WHERE handle = $1 AND id <> $2",
      [handle, req.user.id]
    );
    if (existing.rowCount) {
      res.status(409);
      throw new Error("Handle taken.");
    }

    await pool.query("UPDATE users SET handle = $1 WHERE id = $2", [
      handle,
      req.user.id,
    ]);
    await pool.query(
      "UPDATE dashboards SET slug = $1 WHERE user_id = $2 AND is_primary = TRUE",
      [handle, req.user.id]
    );
    return res.json({ handle });
  } catch (error) {
    return next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const payload = await validateTemplateUpdate(req.body);
    const slug = payload.template.toLowerCase();
    await ensureTemplateExists(slug);
    await pool.query("UPDATE profiles SET template = $1 WHERE user_id = $2", [
      slug,
      req.user.id,
    ]);
    return res.json({ template: slug });
  } catch (error) {
    return next(error);
  }
};

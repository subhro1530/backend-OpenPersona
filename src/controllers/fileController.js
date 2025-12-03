import multer from "multer";
import {
  uploadFile as uploadToS3,
  deleteFile as deleteFromS3,
  generateSignedUrl,
} from "../utils/s3Helpers.js";
import pool from "../config/db.js";

const storage = multer.memoryStorage();
export const fileUploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

const buildKey = (userId, category, originalName, dashboardSlug) => {
  const timestamp = Date.now();
  switch (category) {
    case "avatar":
      return `users/${userId}/avatars/${timestamp}-${originalName}`;
    case "banner":
      return `users/${userId}/banners/${timestamp}-${originalName}`;
    case "portfolio":
      return `users/${userId}/portfolio/${timestamp}-${originalName}`;
    case "project":
      if (!dashboardSlug) {
        throw new Error("dashboardSlug is required for project uploads.");
      }
      return `users/${userId}/projects/${dashboardSlug}/${timestamp}-${originalName}`;
    default:
      throw new Error(
        "Unsupported upload category. Use avatar, banner, portfolio, or project."
      );
  }
};

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file provided.");
    }

    const category = req.body.category || "project";
    const dashboardSlug = req.body.dashboardSlug;
    const key = buildKey(
      req.user.id,
      category,
      req.file.originalname,
      dashboardSlug
    );

    await uploadToS3(req.file.buffer, req.file.mimetype, key);

    const result = await pool.query(
      `INSERT INTO uploads (user_id, object_key, content_type, size, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, object_key, category, created_at`,
      [req.user.id, key, req.file.mimetype, req.file.size, category]
    );

    return res.status(201).json({ upload: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const listFiles = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, object_key, content_type, size, category, created_at
       FROM uploads WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ files: result.rows });
  } catch (error) {
    return next(error);
  }
};

export const getFileUrl = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT object_key FROM uploads WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("File not found.");
    }

    const signedUrl = await generateSignedUrl(result.rows[0].object_key, 300);
    return res.json({ url: signedUrl });
  } catch (error) {
    return next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM uploads WHERE id = $1 AND user_id = $2 RETURNING object_key",
      [req.params.id, req.user.id]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("File not found.");
    }

    await deleteFromS3(result.rows[0].object_key);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

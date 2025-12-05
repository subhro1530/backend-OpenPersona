import pool from "../config/db.js";

const mapTemplate = (row) => ({
  slug: row.slug,
  name: row.name,
  description: row.description,
  previewUrl: row.preview_url,
  isActive: row.is_active,
  themeConfig: row.theme_config || {},
  componentSnippets: row.component_snippets || {},
});

export const listActiveTemplates = async () => {
  const result = await pool.query(
    `SELECT slug, name, description, preview_url, is_active, theme_config, component_snippets
       FROM templates
       WHERE is_active = TRUE
       ORDER BY name`
  );
  return result.rows.map(mapTemplate);
};

export const listAllTemplates = async () => {
  const result = await pool.query(
    `SELECT slug, name, description, preview_url, is_active, theme_config, component_snippets, updated_at
       FROM templates
       ORDER BY updated_at DESC, created_at DESC`
  );
  return result.rows.map(mapTemplate);
};

export const ensureTemplateExists = async (slug, options = {}) => {
  if (!slug) return null;
  const { includeInactive = false } = options;
  const result = await pool.query(
    `SELECT slug FROM templates
       WHERE slug = $1 ${includeInactive ? "" : "AND is_active = TRUE"}
       LIMIT 1`,
    [slug]
  );
  if (!result.rowCount) {
    const error = new Error("Template not found.");
    error.status = 400;
    throw error;
  }
  return result.rows[0];
};

export const createTemplateRecord = async (payload) => {
  const normalizedSlug = payload.slug.toLowerCase();
  const result = await pool.query(
    `INSERT INTO templates (slug, name, description, preview_url, is_active, theme_config, component_snippets)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
       RETURNING slug, name, description, preview_url, is_active, theme_config, component_snippets`,
    [
      normalizedSlug,
      payload.name,
      payload.description || null,
      payload.previewUrl,
      payload.isActive ?? true,
      JSON.stringify(payload.themeConfig || {}),
      JSON.stringify(payload.componentSnippets || {}),
    ]
  );
  return mapTemplate(result.rows[0]);
};

export const updateTemplateRecord = async (slug, payload) => {
  const normalizedSlug = slug.toLowerCase();
  const existing = await pool.query(
    `SELECT slug, name, description, preview_url, is_active, theme_config, component_snippets
       FROM templates
       WHERE slug = $1
       LIMIT 1`,
    [normalizedSlug]
  );

  if (!existing.rowCount) {
    const error = new Error("Template not found.");
    error.status = 404;
    throw error;
  }

  const current = existing.rows[0];
  const next = {
    name: payload.name ?? current.name,
    description:
      payload.description !== undefined
        ? payload.description
        : current.description,
    previewUrl: payload.previewUrl ?? current.preview_url,
    isActive:
      payload.isActive !== undefined ? payload.isActive : current.is_active,
    themeConfig:
      payload.themeConfig !== undefined
        ? payload.themeConfig
        : current.theme_config || {},
    componentSnippets:
      payload.componentSnippets !== undefined
        ? payload.componentSnippets
        : current.component_snippets || {},
  };

  const result = await pool.query(
    `UPDATE templates
        SET name = $2,
            description = $3,
            preview_url = $4,
            is_active = $5,
            theme_config = $6::jsonb,
            component_snippets = $7::jsonb,
            updated_at = NOW()
       WHERE slug = $1
       RETURNING slug, name, description, preview_url, is_active, theme_config, component_snippets`,
    [
      normalizedSlug,
      next.name,
      next.description,
      next.previewUrl,
      next.isActive,
      JSON.stringify(next.themeConfig || {}),
      JSON.stringify(next.componentSnippets || {}),
    ]
  );

  return mapTemplate(result.rows[0]);
};

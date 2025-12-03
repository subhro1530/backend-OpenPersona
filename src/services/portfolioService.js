import slugify from "slugify";
import pool from "../config/db.js";
import { generateSignedUrl } from "../utils/s3Helpers.js";
import { canCreateDashboard } from "../config/plans.js";

const mediaCategories = ["avatar", "banner", "project", "portfolio"];

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const COLLECTION_MAPPERS = {
  experiences: {
    table: "experiences",
    columns: ["company", "role", "summary", "start_date", "end_date"],
    map: (item) => [
      item.company,
      item.role,
      item.summary || null,
      parseDate(item.startDate),
      parseDate(item.endDate),
    ],
  },
  education: {
    table: "education",
    columns: ["institution", "degree", "summary", "start_date", "end_date"],
    map: (item) => [
      item.institution,
      item.degree || null,
      item.summary || null,
      parseDate(item.startDate),
      parseDate(item.endDate),
    ],
  },
  projects: {
    table: "projects",
    columns: ["title", "description", "tags", "links"],
    map: (item) => [
      item.title,
      item.description || null,
      Array.isArray(item.tags) ? item.tags : [],
      Array.isArray(item.links) ? item.links : [],
    ],
  },
  achievements: {
    table: "achievements",
    columns: ["title", "description"],
    map: (item) => [item.title, item.description || null],
  },
  skills: {
    table: "skills",
    columns: ["name", "level"],
    map: (item) => [item.name, item.level || null],
  },
  certifications: {
    table: "certifications",
    columns: [
      "name",
      "issuer",
      "summary",
      "credential_id",
      "issued_at",
      "expires_at",
    ],
    map: (item) => [
      item.name,
      item.issuer || null,
      item.summary || null,
      item.credentialId || null,
      parseDate(item.issuedAt),
      parseDate(item.expiresAt),
    ],
  },
};

const replaceCollection = async (client, key, userId, items = []) => {
  const config = COLLECTION_MAPPERS[key];
  if (!config) return;
  await client.query(`DELETE FROM ${config.table} WHERE user_id = $1`, [
    userId,
  ]);
  if (!items.length) return;

  const placeholders = (count) =>
    Array.from({ length: count }, (_, index) => `$${index + 2}`).join(", ");

  for (const item of items) {
    const values = config.map(item);
    await client.query(
      `INSERT INTO ${config.table} (user_id, ${config.columns.join(", ")})
       VALUES ($1, ${placeholders(config.columns.length)})`,
      [userId, ...values]
    );
  }
};

const updateProfile = async (client, userId, profilePayload = {}, summary) => {
  if (!profilePayload && !summary) {
    return;
  }

  const result = await client.query(
    `SELECT headline, bio, location, avatar_url, banner_url, template, social_links
     FROM profiles WHERE user_id = $1`,
    [userId]
  );

  if (!result.rowCount) {
    await client.query(
      `INSERT INTO profiles (user_id, headline, bio, location, avatar_url, banner_url, template, social_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        profilePayload?.headline || null,
        profilePayload?.bio || summary || null,
        profilePayload?.location || null,
        profilePayload?.avatarUrl || null,
        profilePayload?.bannerUrl || null,
        profilePayload?.template || "hire-me",
        JSON.stringify(profilePayload?.socialLinks || []),
      ]
    );
    return;
  }

  const current = result.rows[0];
  const next = {
    headline:
      profilePayload?.headline !== undefined
        ? profilePayload.headline
        : current.headline,
    bio:
      profilePayload?.bio !== undefined
        ? profilePayload.bio
        : summary ?? current.bio,
    location:
      profilePayload?.location !== undefined
        ? profilePayload.location
        : current.location,
    avatarUrl:
      profilePayload?.avatarUrl !== undefined
        ? profilePayload.avatarUrl
        : current.avatar_url,
    bannerUrl:
      profilePayload?.bannerUrl !== undefined
        ? profilePayload.bannerUrl
        : current.banner_url,
    template:
      profilePayload?.template !== undefined
        ? profilePayload.template
        : current.template,
    socialLinks:
      profilePayload?.socialLinks !== undefined
        ? profilePayload.socialLinks
        : current.social_links,
  };

  await client.query(
    `UPDATE profiles
       SET headline = $1,
           bio = $2,
           location = $3,
           avatar_url = $4,
           banner_url = $5,
           template = $6,
           social_links = $7,
           updated_at = NOW()
     WHERE user_id = $8`,
    [
      next.headline,
      next.bio,
      next.location,
      next.avatarUrl,
      next.bannerUrl,
      next.template,
      Array.isArray(next.socialLinks)
        ? JSON.stringify(next.socialLinks)
        : next.socialLinks,
      userId,
    ]
  );
};

const handleDashboardMutation = async (client, user, dashboardPayload = {}) => {
  if (!dashboardPayload) return;
  if (dashboardPayload.id) {
    const existing = await client.query(
      `SELECT id FROM dashboards WHERE id = $1 AND user_id = $2`,
      [dashboardPayload.id, user.id]
    );
    if (!existing.rowCount) {
      throw httpError(404, "Dashboard not found for update.");
    }

    await client.query(
      `UPDATE dashboards
         SET title = COALESCE($1, title),
             slug = COALESCE($2, slug),
             visibility = COALESCE($3, visibility),
             layout = COALESCE($4, layout),
             updated_at = NOW()
       WHERE id = $5`,
      [
        dashboardPayload.title || null,
        dashboardPayload.slug || null,
        dashboardPayload.visibility || null,
        dashboardPayload.layout || null,
        dashboardPayload.id,
      ]
    );
    return;
  }

  if (!dashboardPayload.title) {
    return;
  }

  const countResult = await client.query(
    "SELECT COUNT(*)::int AS count FROM dashboards WHERE user_id = $1",
    [user.id]
  );
  if (!canCreateDashboard(user.plan, countResult.rows[0].count)) {
    throw httpError(
      403,
      "Plan limit reached. Upgrade to add another portfolio."
    );
  }

  const desiredSlug =
    (dashboardPayload.slug || "").toLowerCase().trim() ||
    slugify(dashboardPayload.title, { lower: true, strict: true }) ||
    `portfolio-${Date.now()}`;

  const slugCheck = await client.query(
    "SELECT 1 FROM dashboards WHERE user_id = $1 AND slug = $2",
    [user.id, desiredSlug]
  );
  if (slugCheck.rowCount) {
    throw httpError(409, "Dashboard slug already exists.");
  }

  await client.query(
    `INSERT INTO dashboards (user_id, title, slug, visibility, layout)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      user.id,
      dashboardPayload.title,
      desiredSlug,
      dashboardPayload.visibility || "public",
      dashboardPayload.layout || {},
    ]
  );
};

export const savePortfolioData = async (user, payload) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await updateProfile(client, user.id, payload.profile, payload.summary);

    await replaceCollection(
      client,
      "experiences",
      user.id,
      payload.experiences
    );
    await replaceCollection(client, "education", user.id, payload.education);
    await replaceCollection(client, "projects", user.id, payload.projects);
    await replaceCollection(
      client,
      "achievements",
      user.id,
      payload.achievements
    );
    await replaceCollection(client, "skills", user.id, payload.skills);
    await replaceCollection(
      client,
      "certifications",
      user.id,
      payload.certifications
    );

    await handleDashboardMutation(client, user, payload.dashboard);

    if (payload.publish) {
      await client.query(
        `UPDATE dashboards SET visibility = 'public', updated_at = NOW()
         WHERE user_id = $1 AND is_primary = TRUE`,
        [user.id]
      );
    }

    await client.query("COMMIT");
    return fetchPortfolioData(user.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const fetchPortfolioData = async (userId) => {
  const [
    profile,
    experiences,
    education,
    projects,
    achievements,
    skills,
    certifications,
    uploads,
    resume,
    dashboards,
  ] = await Promise.all([
    pool.query(
      `SELECT user_id, headline, bio, location, avatar_url, banner_url, template, social_links
       FROM profiles WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT id, company, role, summary, start_date, end_date
       FROM experiences WHERE user_id = $1 ORDER BY start_date DESC NULLS LAST, created_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT id, institution, degree, summary, start_date, end_date
       FROM education WHERE user_id = $1 ORDER BY start_date DESC NULLS LAST, created_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT id, title, description, tags, links, dashboard_slug
       FROM projects WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT id, title, description FROM achievements WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT id, name, level FROM skills WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT id, name, issuer, summary, credential_id, issued_at, expires_at
       FROM certifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT id, object_key, category, created_at
       FROM uploads WHERE user_id = $1 AND category = ANY($2)
       ORDER BY created_at DESC`,
      [userId, mediaCategories]
    ),
    pool.query(
      `SELECT id, analysis FROM resumes WHERE user_id = $1 AND analysis IS NOT NULL
       ORDER BY analyzed_at DESC NULLS LAST, created_at DESC LIMIT 1`,
      [userId]
    ),
    pool.query(
      `SELECT id, title, slug, visibility, layout, is_primary, updated_at
       FROM dashboards WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    ),
  ]);

  const media = await Promise.all(
    uploads.rows.map(async (file) => {
      try {
        const url = await generateSignedUrl(file.object_key, 600);
        return {
          id: file.id,
          category: file.category,
          objectKey: file.object_key,
          url,
          createdAt: file.created_at,
        };
      } catch (error) {
        return {
          id: file.id,
          category: file.category,
          objectKey: file.object_key,
          url: null,
          createdAt: file.created_at,
          error: "Failed to sign URL",
        };
      }
    })
  );

  const latestDraft = resume.rows[0]?.analysis?.portfolioDraft || null;

  return {
    profile: profile.rows[0] || null,
    experiences: experiences.rows,
    education: education.rows,
    projects: projects.rows,
    achievements: achievements.rows,
    skills: skills.rows,
    certifications: certifications.rows,
    media,
    draft: latestDraft,
    dashboards: dashboards.rows,
  };
};

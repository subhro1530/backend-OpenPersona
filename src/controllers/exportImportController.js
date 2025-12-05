import pool from "../config/db.js";

// --- Export User Data ---
export const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || "json";

    // Fetch user profile
    const userResult = await pool.query(
      `SELECT id, name, email, handle, plan, created_at FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];

    // Fetch profile
    const profileResult = await pool.query(
      `SELECT headline, bio, avatar_url, cover_url, template FROM profiles WHERE user_id = $1`,
      [userId]
    );
    const profile = profileResult.rows[0] || {};

    // Fetch all dashboards
    const dashboardsResult = await pool.query(
      `SELECT id, title, slug, visibility, is_primary, theme, layout, created_at FROM dashboards WHERE user_id = $1`,
      [userId]
    );
    const dashboards = dashboardsResult.rows;

    // Fetch links
    const linksResult = await pool.query(
      `SELECT l.id, l.title, l.url, l.icon, l.position, l.is_active, l.dashboard_id
       FROM links l
       JOIN dashboards d ON d.id = l.dashboard_id
       WHERE d.user_id = $1
       ORDER BY l.position`,
      [userId]
    );
    const links = linksResult.rows;

    // Fetch projects
    const projectsResult = await pool.query(
      `SELECT p.id, p.title, p.description, p.cover_image, p.live_url, p.repo_url, p.tags, p.position
       FROM projects p
       JOIN dashboards d ON d.id = p.dashboard_id
       WHERE d.user_id = $1
       ORDER BY p.position`,
      [userId]
    );
    const projects = projectsResult.rows;

    // Fetch experience
    const experienceResult = await pool.query(
      `SELECT * FROM experience WHERE user_id = $1 ORDER BY start_date DESC`,
      [userId]
    );
    const experience = experienceResult.rows;

    // Fetch education
    const educationResult = await pool.query(
      `SELECT * FROM education WHERE user_id = $1 ORDER BY start_date DESC`,
      [userId]
    );
    const education = educationResult.rows;

    // Fetch skills
    const skillsResult = await pool.query(
      `SELECT * FROM skills WHERE user_id = $1 ORDER BY position`,
      [userId]
    );
    const skills = skillsResult.rows;

    // Fetch certifications
    const certificationsResult = await pool.query(
      `SELECT * FROM certifications WHERE user_id = $1 ORDER BY issue_date DESC`,
      [userId]
    );
    const certifications = certificationsResult.rows;

    // Fetch social links
    const socialLinksResult = await pool.query(
      `SELECT * FROM social_links WHERE user_id = $1 ORDER BY position`,
      [userId]
    );
    const socialLinks = socialLinksResult.rows;

    // Fetch testimonials
    const testimonialsResult = await pool.query(
      `SELECT * FROM testimonials WHERE user_id = $1 AND status = 'approved' ORDER BY created_at DESC`,
      [userId]
    );
    const testimonials = testimonialsResult.rows;

    // Fetch settings
    const settingsResult = await pool.query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId]
    );
    const settings = settingsResult.rows[0] || {};

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      user,
      profile,
      settings,
      dashboards,
      links,
      projects,
      experience,
      education,
      skills,
      certifications,
      socialLinks,
      testimonials,
    };

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="openpersona-export-${user.handle}.json"`
      );
      return res.json(exportData);
    } else {
      // CSV export (simplified - just user and profile)
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="openpersona-export-${user.handle}.csv"`
      );
      const csvRows = [
        ["Field", "Value"],
        ["Name", user.name],
        ["Email", user.email],
        ["Handle", user.handle],
        ["Plan", user.plan],
        ["Headline", profile.headline || ""],
        ["Bio", profile.bio || ""],
        ["Template", profile.template || ""],
        ["Created At", user.created_at],
      ];
      const csv = csvRows
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      return res.send(csv);
    }
  } catch (error) {
    return next(error);
  }
};

// --- Import User Data ---
export const importUserData = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { data, overwrite = false } = req.body;
    if (!data) {
      res.status(400);
      throw new Error("Import data is required.");
    }

    const importData = typeof data === "string" ? JSON.parse(data) : data;
    const userId = req.user.id;
    const imported = {
      links: 0,
      projects: 0,
      experience: 0,
      education: 0,
      skills: 0,
      certifications: 0,
      socialLinks: 0,
    };

    await client.query("BEGIN");

    // Update profile if provided
    if (importData.profile) {
      const p = importData.profile;
      await client.query(
        `UPDATE profiles SET headline = COALESCE($1, headline), bio = COALESCE($2, bio) WHERE user_id = $3`,
        [p.headline, p.bio, userId]
      );
    }

    // Get primary dashboard
    const dashboardResult = await client.query(
      `SELECT id FROM dashboards WHERE user_id = $1 AND is_primary = TRUE LIMIT 1`,
      [userId]
    );
    const dashboardId = dashboardResult.rows[0]?.id;

    if (!dashboardId) {
      throw new Error("No primary dashboard found.");
    }

    // Import links
    if (importData.links && Array.isArray(importData.links)) {
      if (overwrite) {
        await client.query(`DELETE FROM links WHERE dashboard_id = $1`, [
          dashboardId,
        ]);
      }
      for (const link of importData.links) {
        await client.query(
          `INSERT INTO links (dashboard_id, title, url, icon, position, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            dashboardId,
            link.title,
            link.url,
            link.icon || null,
            link.position || 0,
            link.is_active !== false,
          ]
        );
        imported.links++;
      }
    }

    // Import projects
    if (importData.projects && Array.isArray(importData.projects)) {
      if (overwrite) {
        await client.query(
          `DELETE FROM projects WHERE dashboard_id IN (SELECT id FROM dashboards WHERE user_id = $1)`,
          [userId]
        );
      }
      for (const project of importData.projects) {
        await client.query(
          `INSERT INTO projects (dashboard_id, title, description, cover_image, live_url, repo_url, tags, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            dashboardId,
            project.title,
            project.description || null,
            project.cover_image || null,
            project.live_url || null,
            project.repo_url || null,
            project.tags || null,
            project.position || 0,
          ]
        );
        imported.projects++;
      }
    }

    // Import experience
    if (importData.experience && Array.isArray(importData.experience)) {
      if (overwrite) {
        await client.query(`DELETE FROM experience WHERE user_id = $1`, [
          userId,
        ]);
      }
      for (const exp of importData.experience) {
        await client.query(
          `INSERT INTO experience (user_id, company, title, location, start_date, end_date, is_current, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            exp.company,
            exp.title,
            exp.location || null,
            exp.start_date,
            exp.end_date || null,
            exp.is_current || false,
            exp.description || null,
          ]
        );
        imported.experience++;
      }
    }

    // Import education
    if (importData.education && Array.isArray(importData.education)) {
      if (overwrite) {
        await client.query(`DELETE FROM education WHERE user_id = $1`, [
          userId,
        ]);
      }
      for (const edu of importData.education) {
        await client.query(
          `INSERT INTO education (user_id, institution, degree, field_of_study, start_date, end_date, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            edu.institution,
            edu.degree || null,
            edu.field_of_study || null,
            edu.start_date,
            edu.end_date || null,
            edu.description || null,
          ]
        );
        imported.education++;
      }
    }

    // Import skills
    if (importData.skills && Array.isArray(importData.skills)) {
      if (overwrite) {
        await client.query(`DELETE FROM skills WHERE user_id = $1`, [userId]);
      }
      for (const skill of importData.skills) {
        await client.query(
          `INSERT INTO skills (user_id, name, category, proficiency, position)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
            skill.name,
            skill.category || null,
            skill.proficiency || null,
            skill.position || 0,
          ]
        );
        imported.skills++;
      }
    }

    // Import certifications
    if (importData.certifications && Array.isArray(importData.certifications)) {
      if (overwrite) {
        await client.query(`DELETE FROM certifications WHERE user_id = $1`, [
          userId,
        ]);
      }
      for (const cert of importData.certifications) {
        await client.query(
          `INSERT INTO certifications (user_id, name, issuer, issue_date, expiry_date, credential_id, credential_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            cert.name,
            cert.issuer || null,
            cert.issue_date || null,
            cert.expiry_date || null,
            cert.credential_id || null,
            cert.credential_url || null,
          ]
        );
        imported.certifications++;
      }
    }

    // Import social links
    if (importData.socialLinks && Array.isArray(importData.socialLinks)) {
      if (overwrite) {
        await client.query(`DELETE FROM social_links WHERE user_id = $1`, [
          userId,
        ]);
      }
      for (const sl of importData.socialLinks) {
        await client.query(
          `INSERT INTO social_links (user_id, platform, url, position)
           VALUES ($1, $2, $3, $4)`,
          [userId, sl.platform, sl.url, sl.position || 0]
        );
        imported.socialLinks++;
      }
    }

    await client.query("COMMIT");

    return res.json({
      message: "Import completed successfully.",
      imported,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

// --- Export Resume as PDF (placeholder - would need puppeteer/pdfkit) ---
export const exportResumePDF = async (req, res, next) => {
  try {
    res.status(501);
    throw new Error("PDF export coming soon. Use JSON export for now.");
  } catch (error) {
    return next(error);
  }
};

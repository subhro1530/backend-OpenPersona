import pool from "../config/db.js";

export const getIdentityBundle = async (userId) => {
  const queries = [
    pool.query(
      `SELECT u.name, u.handle, u.email, p.headline, p.bio, p.template
        FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = $1`,
      [userId]
    ),
    pool.query(
      "SELECT id, title, slug, visibility, layout FROM dashboards WHERE user_id = $1",
      [userId]
    ),
    pool.query(
      "SELECT name, level FROM skills WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    ),
    pool.query(
      "SELECT title, description, tags FROM projects WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    ),
    pool.query(
      "SELECT company, role, summary FROM experiences WHERE user_id = $1 ORDER BY start_date DESC",
      [userId]
    ),
    pool.query(
      "SELECT title, description FROM achievements WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    ),
    pool.query(
      "SELECT institution, degree, summary FROM education WHERE user_id = $1 ORDER BY start_date DESC",
      [userId]
    ),
    pool.query(
      "SELECT label, url FROM links WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    ),
    pool.query(
      "SELECT id, title, created_at, analysis FROM resumes WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    ),
  ];

  const [
    profile,
    dashboards,
    skills,
    projects,
    experiences,
    achievements,
    education,
    links,
    resumes,
  ] = await Promise.all(queries);

  return {
    profile: profile.rows[0] || null,
    dashboards: dashboards.rows,
    skills: skills.rows,
    projects: projects.rows,
    experiences: experiences.rows,
    achievements: achievements.rows,
    education: education.rows,
    links: links.rows,
    resumes: resumes.rows,
    latestAnalysis: resumes.rows.find((row) => row.analysis)?.analysis || null,
    resume: resumes.rows.find((row) => row.analysis)?.analysis || null,
  };
};

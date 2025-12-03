import pool from "../config/db.js";
import { signToken } from "../utils/jwt.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { validateRegister, validateLogin } from "../utils/validators.js";
import { getPlanDefinition } from "../config/plans.js";

const baseUserFields =
  "id, name, email, handle, plan, is_admin, is_blocked, created_at";

export const register = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const payload = await validateRegister(req.body);
    const { name, email, password, handle } = payload;

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1 OR handle = $2 LIMIT 1",
      [email.toLowerCase(), handle.toLowerCase()]
    );

    if (existing.rowCount) {
      res.status(409);
      throw new Error("Email or handle already in use.");
    }

    const passwordHash = await hashPassword(password);
    const plan = getPlanDefinition("free");
    const userResult = await client.query(
      `INSERT INTO users (name, email, handle, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING ${baseUserFields}`,
      [name, email.toLowerCase(), handle.toLowerCase(), passwordHash]
    );

    await client.query(
      `INSERT INTO profiles (user_id, headline, template)
       VALUES ($1, NULL, 'hire-me')`,
      [userResult.rows[0].id]
    );

    await client.query(
      `INSERT INTO dashboards (user_id, title, slug, visibility, is_primary)
       VALUES ($1, $2, $3, 'public', TRUE)`,
      [
        userResult.rows[0].id,
        `${name.split(" ")[0] || handle}'s Identity`,
        handle.toLowerCase(),
      ]
    );

    await client.query(
      `INSERT INTO user_subscriptions (user_id, plan_tier, price_inr)
       VALUES ($1, $2, $3)`,
      [userResult.rows[0].id, plan.tier, plan.priceInr]
    );

    await client.query("COMMIT");

    const token = signToken({
      id: userResult.rows[0].id,
      handle: userResult.rows[0].handle,
    });

    return res.status(201).json({ user: userResult.rows[0], token });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

export const login = async (req, res, next) => {
  try {
    const payload = await validateLogin(req.body);
    const { email, password } = payload;

    const result = await pool.query(
      `SELECT ${baseUserFields}, password_hash FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );

    if (!result.rowCount) {
      res.status(401);
      throw new Error("Invalid credentials.");
    }

    const user = result.rows[0];
    if (user.is_blocked) {
      res.status(403);
      throw new Error("Account is temporarily blocked.");
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      res.status(401);
      throw new Error("Invalid credentials.");
    }

    delete user.password_hash;
    const token = signToken({ id: user.id, handle: user.handle });

    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.${baseUserFields}, u.plan_updated_at,
              p.headline, p.bio, p.template,
              pl.name AS plan_name, pl.price_inr
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       LEFT JOIN plans pl ON pl.tier = u.plan
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!result.rowCount) {
      res.status(404);
      throw new Error("User not found.");
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

import pool from "../config/db.js";
import { signToken } from "../utils/jwt.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  validateRegister,
  validateLogin,
  validateAdminRegister,
  validateAdminUpgrade,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
} from "../utils/validators.js";
import { getPlanDefinition } from "../config/plans.js";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetUsed,
  createVerificationToken,
  verifyEmailToken,
  markEmailVerified,
  revokeToken,
  changeUserPassword,
} from "../utils/authHelpers.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/email.js";

const baseUserFields =
  "u.id, u.name, u.email, u.handle, u.plan, u.is_admin, u.is_blocked, u.created_at";

const ADMIN_ENROLLMENT_CODE = "admin@openpersona";

const fetchUserWithProfile = async (userId) => {
  const result = await pool.query(
    `SELECT ${baseUserFields}, u.plan_updated_at,
            p.headline, p.bio, p.template,
            pl.name AS plan_name, pl.price_inr
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       LEFT JOIN plans pl ON pl.tier = u.plan
      WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

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
       RETURNING id, name, email, handle, plan, is_admin, is_blocked, created_at`,
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

export const registerAdmin = async (req, res, next) => {
  if (!ADMIN_ENROLLMENT_CODE) {
    return res
      .status(503)
      .json({ message: "Admin enrollment code is not configured." });
  }

  const client = await pool.connect();
  try {
    const payload = await validateAdminRegister(req.body);
    const { adminCode, name, email, password, handle } = payload;

    if (adminCode !== ADMIN_ENROLLMENT_CODE) {
      res.status(403);
      throw new Error("Invalid admin enrollment code.");
    }

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
    const plan = getPlanDefinition("scale");
    const userResult = await client.query(
      `INSERT INTO users (name, email, handle, password_hash, plan, is_admin)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, name, email, handle, plan, is_admin, is_blocked, created_at`,
      [name, email.toLowerCase(), handle.toLowerCase(), passwordHash, plan.tier]
    );

    await client.query(
      `INSERT INTO profiles (user_id, headline, template)
       VALUES ($1, 'Admin Playground', 'hire-me')`,
      [userResult.rows[0].id]
    );

    await client.query(
      `INSERT INTO dashboards (user_id, title, slug, visibility, is_primary)
       VALUES ($1, $2, $3, 'private', TRUE)`,
      [
        userResult.rows[0].id,
        `${name.split(" ")[0] || handle} Admin Board`,
        `${handle.toLowerCase()}-admin`,
      ]
    );

    await client.query(
      `INSERT INTO user_subscriptions (user_id, plan_tier, price_inr, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        userResult.rows[0].id,
        plan.tier,
        0,
        JSON.stringify({ source: "admin-enrollment" }),
      ]
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

export const upgradeToAdmin = async (req, res, next) => {
  try {
    const payload = await validateAdminUpgrade(req.body);
    if (payload.adminCode !== ADMIN_ENROLLMENT_CODE) {
      res.status(403);
      throw new Error("Invalid admin enrollment code.");
    }

    const current = await fetchUserWithProfile(req.user.id);
    if (!current) {
      res.status(404);
      throw new Error("User not found.");
    }

    if (current.is_admin) {
      return res.json({ user: current, alreadyAdmin: true });
    }

    const plan = getPlanDefinition("scale");
    await pool.query(
      `UPDATE users
          SET is_admin = TRUE,
              plan = $2,
              plan_updated_at = NOW()
        WHERE id = $1`,
      [req.user.id, plan.tier]
    );

    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_tier, price_inr, metadata)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, plan.tier, 0, JSON.stringify({ source: "admin-upgrade" })]
    );

    const updated = await fetchUserWithProfile(req.user.id);
    return res.json({ user: updated, upgraded: true });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const payload = await validateLogin(req.body);
    const { email, password } = payload;

    const result = await pool.query(
      `SELECT id, name, email, handle, plan, is_admin, is_blocked, created_at, password_hash
       FROM users WHERE email = $1 LIMIT 1`,
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
    const user = await fetchUserWithProfile(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

// --- Forgot Password ---
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = await validateForgotPassword(req.body);
    const result = await pool.query(
      `SELECT id, email, name FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );
    // Always return success to prevent email enumeration
    if (!result.rowCount) {
      return res.json({
        message: "If the email exists, a reset link has been sent.",
      });
    }
    const user = result.rows[0];
    const token = await createPasswordResetToken(user.id);
    const baseUrl =
      process.env.FRONTEND_URL ||
      req.headers.origin ||
      `${req.protocol}://${req.get("host")}`;
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetLink);
    return res.json({
      message: "If the email exists, a reset link has been sent.",
    });
  } catch (error) {
    return next(error);
  }
};

// --- Reset Password ---
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = await validateResetPassword(req.body);
    const resetData = await verifyPasswordResetToken(token);
    if (!resetData) {
      res.status(400);
      throw new Error("Invalid or expired reset token.");
    }
    const passwordHash = await hashPassword(newPassword);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      passwordHash,
      resetData.user_id,
    ]);
    await markPasswordResetUsed(resetData.id);
    return res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    return next(error);
  }
};

// --- Change Password (Authenticated) ---
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = await validateChangePassword(
      req.body
    );
    const result = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rowCount) {
      res.status(404);
      throw new Error("User not found.");
    }
    const match = await comparePassword(
      currentPassword,
      result.rows[0].password_hash
    );
    if (!match) {
      res.status(401);
      throw new Error("Current password is incorrect.");
    }
    const passwordHash = await hashPassword(newPassword);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      passwordHash,
      req.user.id,
    ]);
    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    return next(error);
  }
};

// --- Request Email Verification ---
export const requestVerification = async (req, res, next) => {
  try {
    const user = await pool.query(
      `SELECT id, email, name, email_verified FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!user.rowCount) {
      res.status(404);
      throw new Error("User not found.");
    }
    if (user.rows[0].email_verified) {
      return res.json({ message: "Email already verified." });
    }
    const token = await createVerificationToken(req.user.id);
    const baseUrl =
      process.env.FRONTEND_URL ||
      req.headers.origin ||
      `${req.protocol}://${req.get("host")}`;
    const verifyLink = `${baseUrl}/verify-email?token=${token}`;
    await sendVerificationEmail(
      user.rows[0].email,
      user.rows[0].name,
      verifyLink
    );
    return res.json({ message: "Verification email sent." });
  } catch (error) {
    return next(error);
  }
};

// --- Verify Email ---
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400);
      throw new Error("Token is required.");
    }
    const user = await verifyEmailToken(token);
    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired verification token.");
    }
    await markEmailVerified(user.id);
    return res.json({ message: "Email verified successfully." });
  } catch (error) {
    return next(error);
  }
};

// --- Logout (Token Blacklist) ---
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Token revocation requires jti - for now just acknowledge logout
      // In production, extract jti from token and call revokeToken
    }
    return res.json({ message: "Logged out successfully." });
  } catch (error) {
    return next(error);
  }
};

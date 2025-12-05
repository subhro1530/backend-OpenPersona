import pool from "../config/db.js";
import crypto from "crypto";
import { hashPassword, comparePassword } from "./password.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email.js";

const generateToken = () => crypto.randomBytes(32).toString("hex");

export const createPasswordResetToken = async (
  userId,
  expiresInMinutes = 60
) => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  await pool.query(
    `INSERT INTO password_resets (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
  return token;
};

export const verifyPasswordResetToken = async (token) => {
  const result = await pool.query(
    `SELECT id, user_id, expires_at, used_at
       FROM password_resets
       WHERE token = $1
       LIMIT 1`,
    [token]
  );
  if (!result.rowCount) return null;
  const row = result.rows[0];
  if (row.used_at) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  return row;
};

export const markPasswordResetUsed = async (id) => {
  await pool.query(`UPDATE password_resets SET used_at = NOW() WHERE id = $1`, [
    id,
  ]);
};

export const createVerificationToken = async (userId, expiresInHours = 24) => {
  const token = generateToken();
  const expires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  await pool.query(
    `UPDATE users
        SET verification_token = $1, verification_expires = $2
      WHERE id = $3`,
    [token, expires, userId]
  );
  return token;
};

export const verifyEmailToken = async (token) => {
  const result = await pool.query(
    `SELECT id, email, email_verified, verification_expires
       FROM users
       WHERE verification_token = $1
       LIMIT 1`,
    [token]
  );
  if (!result.rowCount) return null;
  const user = result.rows[0];
  if (user.email_verified) return null;
  if (new Date(user.verification_expires) < new Date()) return null;
  return user;
};

export const markEmailVerified = async (userId) => {
  await pool.query(
    `UPDATE users
        SET email_verified = TRUE,
            verification_token = NULL,
            verification_expires = NULL
      WHERE id = $1`,
    [userId]
  );
};

export const revokeToken = async (userId, jti, expiresAt) => {
  await pool.query(
    `INSERT INTO revoked_tokens (user_id, jti, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (jti) DO NOTHING`,
    [userId, jti, expiresAt]
  );
};

export const isTokenRevoked = async (jti) => {
  const result = await pool.query(
    `SELECT id FROM revoked_tokens WHERE jti = $1 LIMIT 1`,
    [jti]
  );
  return result.rowCount > 0;
};

export const changeUserPassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const result = await pool.query(
    `SELECT password_hash FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rowCount) {
    throw Object.assign(new Error("User not found."), { status: 404 });
  }
  const match = await comparePassword(
    currentPassword,
    result.rows[0].password_hash
  );
  if (!match) {
    throw Object.assign(new Error("Current password incorrect."), {
      status: 401,
    });
  }
  const newHash = await hashPassword(newPassword);
  await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    newHash,
    userId,
  ]);
};

export const resetUserPassword = async (userId, newPassword) => {
  const newHash = await hashPassword(newPassword);
  await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    newHash,
    userId,
  ]);
};

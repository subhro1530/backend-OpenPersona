import pool from "../config/db.js";
import crypto from "crypto";
import { sendTestimonialRequestEmail } from "../utils/email.js";

export const createTestimonialRequest = async (
  userId,
  recipientEmail,
  recipientName,
  message,
  baseUrl
) => {
  const token = crypto.randomBytes(24).toString("hex");
  const result = await pool.query(
    `INSERT INTO testimonial_requests (user_id, recipient_email, recipient_name, message, token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, recipientEmail, recipientName || null, message || null, token]
  );
  const sender = await pool.query(`SELECT name FROM users WHERE id = $1`, [
    userId,
  ]);
  const senderName = sender.rows[0]?.name || "Someone";
  const submitLink = `${baseUrl}/testimonial/submit?token=${token}`;
  await sendTestimonialRequestEmail(
    recipientEmail,
    recipientName,
    senderName,
    message,
    submitLink
  );
  return result.rows[0];
};

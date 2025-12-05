const SMTP_HOST = process.env.SMTP_HOST || null;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || null;
const SMTP_PASS = process.env.SMTP_PASS || null;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@openpersona.dev";

let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;
  if (!SMTP_HOST) {
    console.warn("[Email] SMTP not configured – emails will be logged only.");
    return null;
  }
  const nodemailer = await import("nodemailer");
  transporter = nodemailer.default.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const t = await initTransporter();
  const payload = { from: FROM_EMAIL, to, subject, text, html };
  if (!t) {
    console.log("[Email] Would send:", JSON.stringify(payload, null, 2));
    return { messageId: `mock-${Date.now()}` };
  }
  return t.sendMail(payload);
};

export const sendPasswordResetEmail = async (email, token, baseUrl) => {
  const link = `${baseUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Reset your OpenPersona password",
    text: `Click this link to reset your password: ${link}\n\nIf you didn't request this, ignore this email.`,
    html: `<p>Click <a href="${link}">here</a> to reset your password.</p><p>If you didn't request this, ignore this email.</p>`,
  });
};

export const sendVerificationEmail = async (email, token, baseUrl) => {
  const link = `${baseUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Verify your OpenPersona email",
    text: `Verify your email: ${link}`,
    html: `<p>Click <a href="${link}">here</a> to verify your email.</p>`,
  });
};

export const sendTestimonialRequestEmail = async (
  recipientEmail,
  recipientName,
  senderName,
  message,
  submitLink
) => {
  return sendEmail({
    to: recipientEmail,
    subject: `${senderName} is requesting a testimonial`,
    text: `Hi ${
      recipientName || "there"
    },\n\n${senderName} would love a short testimonial from you.\n\n"${
      message || ""
    }"\n\nSubmit here: ${submitLink}`,
    html: `<p>Hi ${
      recipientName || "there"
    },</p><p>${senderName} would love a short testimonial from you.</p><blockquote>${
      message || ""
    }</blockquote><p><a href="${submitLink}">Submit testimonial</a></p>`,
  });
};

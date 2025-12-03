import "../config/env.js";
import jwt from "jsonwebtoken";

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

export const signToken = (payload, expiresIn = "1d") =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

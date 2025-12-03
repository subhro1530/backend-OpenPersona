import { verifyToken } from "../utils/jwt.js";
import pool from "../config/db.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const result = await pool.query(
      "SELECT id, handle, plan, is_admin, is_blocked FROM users WHERE id = $1",
      [decoded.id]
    );

    if (!result.rowCount) {
      return res.status(401).json({ message: "Account not found." });
    }

    const user = result.rows[0];
    if (user.is_blocked) {
      return res
        .status(403)
        .json({ message: "Account is temporarily blocked." });
    }

    req.user = {
      id: user.id,
      handle: user.handle,
      plan: user.plan,
      isAdmin: user.is_admin,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin privileges required." });
  }
  return next();
};

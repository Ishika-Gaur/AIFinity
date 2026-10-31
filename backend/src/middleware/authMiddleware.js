import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Authentication Middleware:
 * Verifies JWT token stored in HTTP-only cookie 'token'.
 * Attaches authenticated user object to req.user.
 */
export async function authenticate(req, res, next) {
  if (req.method === "OPTIONS") return next();
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. No token provided.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback_dev_secret_key_change_in_prod";
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }
}

export async function optionalAuthenticate(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const jwtSecret = process.env.JWT_SECRET || "fallback_dev_secret_key_change_in_prod";
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (user) req.user = user;
    
    next();
  } catch (err) {
    next();
  }
}

/**
 * Admin Authorization Middleware:
 * Ensures authenticated user has role === 'admin'.
 * Returns 403 Forbidden if user is authenticated but lacks admin privileges.
 */
export function isAdmin(req, res, next) {
  if (req.method === "OPTIONS") return next();

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access forbidden. Administrator privileges required.",
    });
  }

  next();
}

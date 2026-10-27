import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import type { AuthUser } from "../types/express.js";

export type { AuthUser };

/**
 * Stateless signed token auth — works across Vercel serverless instances.
 *
 * Token format: base64url(payload) + "." + HMAC-SHA256(base64url(payload), SECRET)
 * The secret is SESSION_SECRET from env (falls back to a build-time constant only
 * for local dev — production MUST have SESSION_SECRET set).
 */

const SECRET = process.env.SESSION_SECRET || "elibrary_fallback_secret_do_not_use_in_prod";

function b64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function generateToken(user: AuthUser): string {
  const payload = b64url(JSON.stringify(user));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function revokeToken(_token: string): void {
  // Stateless tokens can't be revoked server-side without a denylist.
  // For this app, logout is handled client-side by discarding the token.
}

export function getUserByToken(token: string): AuthUser | undefined {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return undefined;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  // Constant-time comparison
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return undefined;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthUser;
  } catch {
    return undefined;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const user = getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

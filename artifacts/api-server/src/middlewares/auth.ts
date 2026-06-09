import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  campus: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Simple token store: token -> user (in-memory, sufficient for this use case)
const tokenStore = new Map<string, AuthUser>();

export function generateToken(user: AuthUser): string {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(token, user);
  return token;
}

export function revokeToken(token: string): void {
  tokenStore.delete(token);
}

export function getUserByToken(token: string): AuthUser | undefined {
  return tokenStore.get(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const user = tokenStore.get(token);
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

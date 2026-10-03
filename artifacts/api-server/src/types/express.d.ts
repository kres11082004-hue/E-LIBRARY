import type { Logger } from "pino";

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
      log: Logger;
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    log: Logger;
  }
}

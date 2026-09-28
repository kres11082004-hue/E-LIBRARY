/**
 * Vercel Serverless Function entry point.
 *
 * Vercel expects a default export of a Node.js request handler.
 * Express apps are directly compatible — just export the app instance.
 *
 * ⚠️  Known limitations on Vercel (accepted):
 *  - File uploads written to `uploads/` are ephemeral — lost between requests.
 *  - The in-memory token store resets on cold starts; users must log in again.
 */

import process from "process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env when running locally via `vercel dev`; no-op in production.
try {
  process.loadEnvFile(path.resolve(__dirname, "../.env"));
} catch {
  // env vars already injected by Vercel in production
}

import app from "../artifacts/api-server/src/app.js";

export default app;

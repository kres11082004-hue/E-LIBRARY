import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import router from "./routes/index.js";

const app: Express = express();

const isVercel = process.env.VERCEL === "1" || Boolean(process.env.NOW_BUILDER);

if (!isVercel) {
  app.use(pinoHttp({ logger }));
  const uploadsPath = path.resolve(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:19545",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for now; tighten later
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API routes
app.use("/api", router);
app.use(router);

// ---------------------------------------------------------------------------
// Serve built frontend SPA (production only)
// The elibrary Vite build outputs to artifacts/elibrary/dist/public/.
// import.meta.dirname resolves to the api-server's dist/ folder at runtime,
// so ../../elibrary/dist/public correctly points to the frontend build.
// ---------------------------------------------------------------------------
const frontendDist = path.resolve(import.meta.dirname, "../../elibrary/dist/public");
if (fs.existsSync(frontendDist)) {
  logger.info({ frontendDist }, "Serving built frontend SPA");
  app.use(express.static(frontendDist));

  // Catch-all: serve index.html for any non-API GET so the React router works
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;

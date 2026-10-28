import express, { type Express } from "express";
import cors from "cors";
import path from "path";
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
  "https://e-library-nine-chi.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost/127.0.0.1 port (Vite dev server port can vary)
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now; tighten in production
  },
  credentials: true,
}));
// Large limit needed: base64 encoding inflates file size by ~33%.
// A 50 MB PDF becomes ~67 MB in base64, so we need at least 70 MB.
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use("/api", router);
app.use(router);

export default app;

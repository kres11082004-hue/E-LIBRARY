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
  const uploadsPaths = [
    path.resolve(process.cwd(), "uploads"),
    path.resolve(process.cwd(), "artifacts/api-server/uploads"),
    path.resolve(process.cwd(), "../uploads"),
    path.resolve(process.cwd(), "../../uploads"),
  ];
  for (const p of uploadsPaths) {
    app.use("/uploads", express.static(p));
  }
} else {
  app.use("/uploads", express.static("/tmp/uploads"));
}

const allowedOrigins = [
  "https://e-library-nine-chi.vercel.app",
  "https://kres11082004-hue-e-library.vercel.app",
  "https://e-library-rl95x9de2-kres11082004-hues-projects.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost/127.0.0.1 port (Vite dev server port can vary)
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow any vercel.app preview/production deployment for this project
    if (origin.includes("kres11082004") || origin.includes("e-library")) {
      return callback(null, true);
    }
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now; tighten in production
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
// Large limit needed: base64 encoding inflates file size by ~33%.
// A 50 MB PDF becomes ~67 MB in base64, so we need at least 70 MB.
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.get("/", (req, res) => {
  if (req.accepts("html")) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>ZDSPGC E-Library API</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f1f3d; color: #fff; }
            .card { background: #1a2f55; padding: 2.5rem; border-radius: 12px; text-align: center; max-width: 480px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0.5rem 0; }
            .badge { display: inline-block; background: #10b981; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-bottom: 1rem; }
            a { display: inline-block; margin-top: 1.25rem; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; transition: background 0.2s; }
            a:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">API ACTIVE</div>
            <h1>ZDSPGC E-Library API</h1>
            <p>The backend API server on Render is running normally.</p>
            <p>To use the library portal, please open the frontend app below:</p>
            <a href="https://e-library-nine-chi.vercel.app">Go to E-Library App &rarr;</a>
          </div>
        </body>
      </html>
    `);
    return;
  }
  res.json({
    status: "ok",
    message: "ZDSPGC E-Library API Server is running.",
    frontend: "https://e-library-nine-chi.vercel.app",
    health: "/healthz",
  });
});

app.use("/api", router);
app.use(router);

export default app;

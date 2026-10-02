import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Debug endpoint: tests DB connection + env check (safe to leave in, no secrets exposed)
router.get("/healthz/db", async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  const hasDbUrl = Boolean(dbUrl);
  const dbUrlPreview = dbUrl ? dbUrl.replace(/:[^:@]+@/, ":***@") : "NOT SET";

  try {
    const result = await pool.query("SELECT NOW() as time, current_database() as db");
    res.json({
      status: "ok",
      db: "connected",
      dbTime: result.rows[0]?.time,
      dbName: result.rows[0]?.db,
      hasDbUrl,
      dbUrlPreview,
      nodeEnv: process.env.NODE_ENV,
      isVercel: Boolean(process.env.VERCEL),
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      db: "failed",
      error: err.message,
      hasDbUrl,
      dbUrlPreview,
      nodeEnv: process.env.NODE_ENV,
      isVercel: Boolean(process.env.VERCEL),
    });
  }
});

export default router;


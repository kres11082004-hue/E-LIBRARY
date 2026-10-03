import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "[Warning] DATABASE_URL environment variable is not set. Database operations will require DATABASE_URL to be configured.",
  );
}

const isProduction = process.env.NODE_ENV === "production";

// Strip parameters unsupported by the pg Node.js driver (e.g. channel_binding, sslmode)
function cleanDbUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    parsed.searchParams.delete("sslmode");
    return parsed.toString();
  } catch {
    return url;
  }
}

const cleanedUrl = databaseUrl ? cleanDbUrl(databaseUrl) : undefined;
const isNeon = databaseUrl?.includes(".neon.tech") || databaseUrl?.includes("neon.tech");

export const pool = new Pool({
  connectionString:
    cleanedUrl || "postgres://postgres:postgres@localhost:5432/postgres",
  ssl: (databaseUrl && (databaseUrl.includes("sslmode=require") || isProduction || isNeon))
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";

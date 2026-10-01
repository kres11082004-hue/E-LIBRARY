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

export const pool = new Pool({
  connectionString:
    databaseUrl || "postgres://postgres:postgres@localhost:5432/postgres",
  ssl:
    databaseUrl && (databaseUrl.includes("sslmode=require") || isProduction)
      ? { rejectUnauthorized: false }
      : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "[Warning] DATABASE_URL environment variable is not set. Database operations will require DATABASE_URL to be configured.",
  );
}

export const pool = new Pool({
  connectionString:
    databaseUrl || "postgres://postgres:postgres@localhost:5432/postgres",
});
export const db = drizzle(pool, { schema });

export * from "./schema";

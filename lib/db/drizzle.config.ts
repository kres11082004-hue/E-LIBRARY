import { defineConfig } from "drizzle-kit";
import path from "path";
import process from "process";

try {
  process.loadEnvFile("../../.env");
} catch (e) {
  try {
    process.loadEnvFile(".env");
  } catch (e2) {
    try {
      process.loadEnvFile("../../../.env");
    } catch (e3) {
      const getMessage = (err: unknown) => err instanceof Error ? err.message : String(err);
      console.error("Could not load env file from relative paths:", getMessage(e), getMessage(e2), getMessage(e3));
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});


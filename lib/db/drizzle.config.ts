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
      console.error("Could not load env file from relative paths:", e.message, e2.message, e3.message);
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


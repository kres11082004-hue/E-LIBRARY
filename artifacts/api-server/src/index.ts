import app from "./app";
import { logger } from "./lib/logger";
import path from "path";
import process from "process";

try {
  process.loadEnvFile(path.resolve(import.meta.dirname, "../../.env"));
} catch (e) {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), ".env"));
  } catch (e2) {
    // ignore
  }
}

const rawPort = process.env["PORT"] || process.env["API_PORT"];

if (!rawPort) {
  throw new Error(
    "PORT or API_PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

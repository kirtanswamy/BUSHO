import "dotenv/config";
import { loadConfig } from "./config/env.js";
import { createPool } from "./db/pool.js";
import { createApp } from "./app.js";

const config = loadConfig();
const pool = createPool(config);
const app = createApp({ pool });

const server = app.listen(config.port, config.host, () => {
  console.log(`BUSHO API listening on ${config.host}:${config.port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down BUSHO API`);

  server.close(async () => {
    if (pool) await pool.end();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

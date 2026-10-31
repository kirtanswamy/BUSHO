import express from "express";
import helmet from "helmet";
import { checkDatabase } from "./db/pool.js";

export function createApp({ pool = null } = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "256kb" }));

  app.get("/healthz", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "busho-api",
      environment: process.env.NODE_ENV || "development"
    });
  });

  app.get("/readyz", async (_req, res) => {
    const database = await checkDatabase(pool);
    const ready = database.ok;

    res.status(ready ? 200 : 503).json({
      ok: ready,
      service: "busho-api",
      dependencies: { database }
    });
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "The requested API route does not exist."
      }
    });
  });

  app.use((error, _req, res, _next) => {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) {
      console.error("[api:error]", error.message);
    }

    res.status(status).json({
      error: {
        code: status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST",
        message: status >= 500
          ? "An unexpected server error occurred."
          : error.message
      }
    });
  });

  return app;
}

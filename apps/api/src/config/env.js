const DEFAULTS = {
  NODE_ENV: "development",
  PORT: "3000",
  HOST: "0.0.0.0",
  LOG_LEVEL: "info",
  DATABASE_POOL_MAX: "5"
};

export function loadConfig(env = process.env) {
  const value = (key) => env[key] ?? DEFAULTS[key];

  const port = Number(value("PORT"));
  const poolMax = Number(value("DATABASE_POOL_MAX"));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 50) {
    throw new Error("DATABASE_POOL_MAX must be an integer between 1 and 50");
  }

  return Object.freeze({
    nodeEnv: value("NODE_ENV"),
    port,
    host: value("HOST"),
    logLevel: value("LOG_LEVEL"),
    databaseUrl: env.DATABASE_URL || "",
    databaseSsl: env.DATABASE_SSL === "true",
    databasePoolMax: poolMax
  });
}

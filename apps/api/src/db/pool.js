import pg from "pg";

const { Pool } = pg;

export function createPool(config) {
  if (!config.databaseUrl) return null;

  return new Pool({
    connectionString: config.databaseUrl,
    max: config.databasePoolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: config.databaseSsl ? true : undefined
  });
}

export async function checkDatabase(pool) {
  if (!pool) {
    return { ok: false, reason: "DATABASE_URL is not configured" };
  }

  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch {
    return { ok: false, reason: "Database connection failed" };
  }
}

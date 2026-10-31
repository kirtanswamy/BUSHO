import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

test("GET /healthz returns service health without exposing secrets", async () => {
  const app = createApp();
  const response = await request(app).get("/healthz");

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.service, "busho-api");
  assert.equal("DATABASE_URL" in response.body, false);
});

test("GET /readyz returns 503 when database is not configured", async () => {
  const app = createApp();
  const response = await request(app).get("/readyz");

  assert.equal(response.status, 503);
  assert.equal(response.body.ok, false);
});

test("unknown routes return a consistent JSON 404", async () => {
  const app = createApp();
  const response = await request(app).get("/not-a-route");

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
});

test("invalid JSON is handled as a client error", async () => {
  const app = createApp();
  const response = await request(app)
    .post("/example")
    .set("Content-Type", "application/json")
    .send("{invalid");

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "BAD_REQUEST");
});

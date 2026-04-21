import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app.js";

describe("integration security hardening", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("adds security headers to responses", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=()"
    );
  });

  it("returns hardened jwt errors for missing authorization", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/inventory/stock"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      message: "Authentication token is required"
    });
  });

  it("returns hardened jwt errors for invalid authorization", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/inventory/stock",
      headers: {
        authorization: "Bearer invalid-token"
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      message: "Authentication token is invalid"
    });
  });
});

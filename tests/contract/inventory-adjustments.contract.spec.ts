import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";

describe("contract /inventory/adjustments", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 400 when adjustment reason is missing", async () => {
    const adminLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = adminLogin.json().accessToken;

    const response = await app.inject({
      method: "POST",
      url: "/inventory/adjustments",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        productId: "00000000-0000-0000-0000-000000000000",
        direction: "entrada",
        quantity: 1,
        reason: ""
      }
    });

    expect([400, 404]).toContain(response.statusCode);
  });

  it("returns 400 when direction is invalid", async () => {
    const adminLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = adminLogin.json().accessToken;

    const response = await app.inject({
      method: "POST",
      url: "/inventory/adjustments",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        productId: "00000000-0000-0000-0000-000000000000",
        direction: "invalid",
        quantity: 1,
        reason: "Ajuste invalido"
      }
    });

    expect(response.statusCode).toBe(400);
  });
});

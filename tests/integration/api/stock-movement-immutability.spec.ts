import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app.js";

describe("integration stock movement immutability", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 405 when attempting to delete a stock movement", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const { accessToken } = login.json();

    const response = await app.inject({
      method: "DELETE",
      url: "/inventory/movements/00000000-0000-0000-0000-000000000000",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(405);
    expect(response.json()).toMatchObject({
      message: "Stock movement deletion is not allowed"
    });
  });
});

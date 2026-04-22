import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

describe("DELETE /suppliers/:id", () => {
  const app = buildApp({ logger: false });
  let supplierId = "";
  let token = "";

  beforeAll(async () => {
    await app.ready();
    const loginResponse = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@conveniencia.local", password: "admin123" }
    });
    token = loginResponse.json().accessToken;

    const createResponse = await app.inject({
      method: "POST",
      url: "/suppliers",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: `Test Delete ${Date.now()}` }
    });
    supplierId = createResponse.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("deletes supplier and returns 204", async () => {
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/suppliers/${supplierId}`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(deleteResponse.statusCode).toBe(204);
  });

  it("returns 409 when supplier is linked to products", async () => {
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/suppliers/${supplierId}`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(deleteResponse.statusCode).toBe(409);
    expect(deleteResponse.json().message).toContain("vinculado a produtos");
  });
});
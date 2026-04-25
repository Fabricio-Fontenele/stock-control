import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";

describe("contract /suppliers", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates, updates and lists suppliers for admin", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "admin@conveniencia.local",
        password: "admin123"
      }
    });

    const token = login.json().accessToken;

    const createResponse = await app.inject({
      method: "POST",
      url: "/suppliers",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        name: `Fornecedor Contrato Admin ${randomUUID()}`,
        email: `contrato-${randomUUID()}@fornecedor.local`
      }
    });

    expect(createResponse.statusCode).toBe(201);
    const supplierId = createResponse.json().id;

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/suppliers/${supplierId}`,
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        phone: "85999999999"
      }
    });

    expect(updateResponse.statusCode).toBe(200);

    const listResponse = await app.inject({
      method: "GET",
      url: "/suppliers",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(listResponse.statusCode).toBe(200);
    expect(Array.isArray(listResponse.json().items)).toBe(true);
  });
});

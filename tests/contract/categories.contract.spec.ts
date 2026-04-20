import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";

describe("contract /categories", () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates, updates and lists categories for admin", async () => {
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
      url: "/categories",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        name: "Categoria Contrato Admin",
        description: "Descricao"
      }
    });

    expect(createResponse.statusCode).toBe(201);
    const categoryId = createResponse.json().id;

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/categories/${categoryId}`,
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        description: "Descricao Atualizada"
      }
    });

    expect(updateResponse.statusCode).toBe(200);

    const listResponse = await app.inject({
      method: "GET",
      url: "/categories",
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(listResponse.statusCode).toBe(200);
    expect(Array.isArray(listResponse.json().items)).toBe(true);
  });
});

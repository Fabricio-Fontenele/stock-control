import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const ADMIN_EMAIL = "admin@conveniencia.local";
const ADMIN_PASSWORD = "admin123";
const API_BASE_URL = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3333";
const WEB_BASE_URL = process.env.PLAYWRIGHT_WEB_BASE_URL ?? "http://127.0.0.1:3100";

interface SeedData {
  sku: string;
  productName: string;
}

async function backendRequest<T>(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };

  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Backend request failed (${response.status}) on ${path}: ${message}`);
  }

  return (await response.json()) as T;
}

async function loginAdminInUi(page: Page) {
  const response = await fetch(`${WEB_BASE_URL}/api/auth/login`, {
    method: "POST",
    body: new URLSearchParams({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }),
    redirect: "manual"
  });

  if (response.status !== 303) {
    throw new Error(`Unexpected login response status: ${response.status}`);
  }

  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("Session cookie was not returned by /api/auth/login");
  }

  const cookieMatch = setCookie.match(/sc_session=([^;]+)/);

  if (!cookieMatch?.[1]) {
    throw new Error("Unable to parse sc_session cookie value");
  }

  const webUrl = new URL(WEB_BASE_URL);

  await page.context().addCookies([
    {
      name: "sc_session",
      value: cookieMatch[1],
      domain: webUrl.hostname,
      httpOnly: true,
      sameSite: "Lax",
      secure: webUrl.protocol === "https:",
      path: "/"
    }
  ]);

  await page.goto("/estoque");
  await expect(page).toHaveURL(/\/estoque/);
}

async function seedSmokeData(): Promise<SeedData> {
  const suffix = randomUUID();
  const sku = `E2E-${suffix}`;
  const productName = `Produto E2E ${suffix}`;

  const login = await backendRequest<{
    accessToken: string;
  }>("/auth/login", {
    method: "POST",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });

  const token = login.accessToken;

  const category = await backendRequest<{ id: string }>("/categories", {
    method: "POST",
    token,
    body: {
      name: `Categoria E2E ${suffix}`,
      description: "Categoria para smoke frontend"
    }
  });

  const supplier = await backendRequest<{ id: string }>("/suppliers", {
    method: "POST",
    token,
    body: {
      name: `Fornecedor E2E ${suffix}`,
      document: null,
      contactName: null,
      phone: null,
      email: null
    }
  });

  const product = await backendRequest<{ id: string }>("/products", {
    method: "POST",
    token,
    body: {
      sku,
      name: productName,
      categoryId: category.id,
      supplierId: supplier.id,
      purchasePrice: 5,
      salePrice: 8,
      unitOfMeasure: "un",
      minimumStock: 1,
      tracksExpiration: true
    }
  });

  await backendRequest<{ id: string }>("/inventory/entries", {
    method: "POST",
    token,
    body: {
      productId: product.id,
      lotCode: `LOTE-E2E-${suffix}`,
      quantity: 10,
      entryDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      reasonType: "supplier-purchase"
    }
  });

  return { sku, productName };
}

test.describe("frontend mvp smoke", () => {
  test.describe.configure({ mode: "serial" });

  let seeded: SeedData;

  test.beforeAll(async () => {
    seeded = await seedSmokeData();
  });

  test("login and stock listing are reachable", async ({ page }: { page: Page }) => {
    await loginAdminInUi(page);
    await expect(page.getByRole("heading", { name: "Estoque", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Consultar" })).toBeVisible();
  });

  test("stock search and quick exit flow works", async ({ page }: { page: Page }) => {
    await loginAdminInUi(page);

    await page.getByPlaceholder("Ex.: coca, cerveja, 000123").fill(seeded.sku);
    await page.getByRole("button", { name: "Consultar" }).click();

    await expect(page.getByText(seeded.productName)).toBeVisible();
    await page.getByRole("link", { name: seeded.sku }).first().click();

    await expect(page).toHaveURL(/\/estoque\/saida/);
    await page.getByLabel("Quantidade").fill("1");
    await page.getByRole("button", { name: "Registrar saida" }).click();

    await expect(page).toHaveURL(/success=1/);
    await expect(page.getByText("Saida registrada com sucesso.")).toBeVisible();
  });

  test("catalog and entries flow are reachable for admin", async ({ page }: { page: Page }) => {
    await loginAdminInUi(page);

    await page.goto("/produtos");
    await expect(page.getByRole("heading", { name: "Catalogo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo produto" }).first()).toBeVisible();

    await page.goto("/entradas");
    await expect(page.getByRole("heading", { name: "Entradas por lote" })).toBeVisible();

    const productOptionValue = await page
      .locator('select[name="productId"] option', { hasText: seeded.sku })
      .first()
      .getAttribute("value");

    if (!productOptionValue) {
      throw new Error(`Unable to find product option for SKU ${seeded.sku}`);
    }

    await page.getByLabel("Produto").selectOption(productOptionValue);
    await page.getByLabel("Codigo do lote").fill(`LOTE-UI-${Date.now()}`);
    await page.getByLabel("Quantidade").fill("2");

    const now = new Date(Date.now() + 3600000);
    const expiration = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000);
    const formatDateTimeLocal = (value: Date) => {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      const hours = String(value.getHours()).padStart(2, "0");
      const minutes = String(value.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    await page.getByLabel("Data de entrada").fill(formatDateTimeLocal(now));
    await page.getByLabel("Validade").fill(formatDateTimeLocal(expiration));
    await page.getByRole("button", { name: "Registrar entrada" }).click();

    await expect(page).toHaveURL(/success=created/);
    await expect(page.getByText("Entrada registrada com sucesso.")).toBeVisible();
  });

  test("logout blocks protected route", async ({ page }: { page: Page }) => {
    await loginAdminInUi(page);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/estoque");
    await expect(page).toHaveURL(/\/login/);
  });
});

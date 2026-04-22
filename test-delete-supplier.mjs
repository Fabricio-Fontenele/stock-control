import { randomUUID } from "node:crypto";
import { buildApp } from "../src/app.js";

const app = buildApp({ logger: false });

await app.ready();

const loginResponse = await app.inject({
  method: "POST",
  url: "/auth/login",
  payload: { email: "admin@conveniencia.local", password: "admin123" }
});

const { accessToken } = loginResponse.json();

const createResponse = await app.inject({
  method: "POST",
  url: "/suppliers",
  headers: { authorization: `Bearer ${accessToken}` },
  payload: { name: `Test Delete ${Date.now()}` }
});

console.log("Create status:", createResponse.statusCode);
if (createResponse.statusCode !== 201) {
  console.log("Create error:", createResponse.json());
  await app.close();
  process.exit(1);
}
const supplierId = createResponse.json().id;
console.log("Created supplier ID:", supplierId);

const deleteResponse = await app.inject({
  method: "DELETE",
  url: `/suppliers/${supplierId}`,
  headers: { authorization: `Bearer ${accessToken}` }
});

console.log("Delete status:", deleteResponse.statusCode);
console.log("Delete body:", deleteResponse.body);

await app.close();
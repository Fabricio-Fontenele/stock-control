import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyRequest } from "fastify";

import { loadEnv } from "../../../infrastructure/config/env.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      role: "admin" | "employee";
    };
    user: {
      sub: string;
      email: string;
      role: "admin" | "employee";
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest): Promise<void>;
    ensureAdmin(request: FastifyRequest): Promise<void>;
  }
}

const authPlugin = fp(async (app) => {
  const env = loadEnv();

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });

  app.decorate("authenticate", async (request: FastifyRequest) => {
    await request.jwtVerify();
  });

  app.decorate("ensureAdmin", async (request: FastifyRequest) => {
    await request.jwtVerify();

    if (request.user.role !== "admin") {
      const error = new Error("Admin role required") as Error & { statusCode?: number };
      error.statusCode = 403;
      throw error;
    }
  });
});

export default authPlugin;

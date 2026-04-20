import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyRequest } from "fastify";

import { loadEnv } from "../../../infrastructure/config/env.js";
import { PostgresUserRepository } from "../../../infrastructure/repositories/postgres-user-repository.js";
import { HttpError } from "../../../application/errors/http-error.js";
import type { User } from "../../../domain/entities/user.js";

const ensureActiveAuthenticatedUser = async (request: FastifyRequest): Promise<User> => {
  if (!request.user?.sub) {
    throw new HttpError(401, "Invalid authentication payload");
  }

  const userRepository = new PostgresUserRepository();
  const currentUser = await userRepository.findById(request.user.sub);

  if (!currentUser) {
    throw new HttpError(401, "Authenticated user not found");
  }

  if (currentUser.status !== "active") {
    throw new HttpError(403, "Inactive user");
  }

  return currentUser;
};

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
  interface FastifyRequest {
    currentUser?: User;
  }

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

  app.decorateRequest("currentUser");

  app.decorate("authenticate", async (request: FastifyRequest) => {
    await request.jwtVerify();
    request.currentUser = await ensureActiveAuthenticatedUser(request);
  });

  app.decorate("ensureAdmin", async (request: FastifyRequest) => {
    await request.jwtVerify();

    const currentUser = await ensureActiveAuthenticatedUser(request);
    request.currentUser = currentUser;

    if (currentUser.role !== "admin") {
      throw new HttpError(403, "Admin role required");
    }
  });
});

export default authPlugin;

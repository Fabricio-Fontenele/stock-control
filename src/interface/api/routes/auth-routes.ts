import type { FastifyPluginAsync } from "fastify";

import { PostgresUserRepository } from "../../../infrastructure/repositories/postgres-user-repository.js";
import { BcryptPasswordHasher } from "../../../infrastructure/security/password-hasher.js";
import { FastifyJwtService } from "../../../infrastructure/security/jwt-service.js";
import { LoginUseCase } from "../../../application/use-cases/login.use-case.js";
import { loginRequestSchema } from "../schemas/auth-schemas.js";
import { HttpError } from "../../../application/errors/http-error.js";
import { presentAuthUser } from "../../presenters/http-presenters.js";

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/login", async (request, reply) => {
    const payload = loginRequestSchema.parse(request.body);

    const userRepository = new PostgresUserRepository();
    const passwordHasher = new BcryptPasswordHasher();
    const jwtService = new FastifyJwtService();
    const useCase = new LoginUseCase({
      userRepository,
      passwordHasher
    });

    const token = await useCase.execute(payload, async (jwtPayload) => {
      if (jwtPayload.role !== "admin" && jwtPayload.role !== "employee") {
        throw new HttpError(403, "Unsupported role");
      }

      return jwtService.sign(app, jwtPayload);
    });

    return reply.status(200).send({
      accessToken: token.accessToken,
      user: presentAuthUser(token.user)
    });
  });
};

export default authRoutes;

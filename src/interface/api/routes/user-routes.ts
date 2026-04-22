import type { FastifyPluginAsync } from "fastify";

import { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case.js";
import { ListUsersUseCase } from "../../../application/use-cases/list-users.use-case.js";
import { DeleteUserUseCase } from "../../../application/use-cases/delete-user.use-case.js";
import { PostgresUserRepository } from "../../../infrastructure/repositories/postgres-user-repository.js";
import { BcryptPasswordHasher } from "../../../infrastructure/security/password-hasher.js";
import { HttpError } from "../../../application/errors/http-error.js";

const userRoutes: FastifyPluginAsync = async (app) => {
  app.get("/users", { preHandler: app.ensureAdmin }, async (_request, reply) => {
    const useCase = new ListUsersUseCase({
      userRepository: new PostgresUserRepository()
    });

    const items = await useCase.execute();
    return reply.status(200).send({ items });
  });

  app.post("/users", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const body = request.body as {
      name: string;
      email: string;
      password: string;
      role: "admin" | "employee";
    };

    if (!body.name || !body.email || !body.password) {
      throw new HttpError(400, "Dados incompletos");
    }

    if (body.password.length < 6) {
      throw new HttpError(400, "Senha deve ter pelo menos 6 caracteres");
    }

    const useCase = new CreateUserUseCase({
      userRepository: new PostgresUserRepository(),
      passwordHasher: new BcryptPasswordHasher()
    });

    const user = await useCase.execute({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || "employee"
    });

    return reply.status(201).send(user);
  });

  app.delete("/users/:userId", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const params = request.params as { userId: string };
    const currentUser = request.currentUser;

    if (!currentUser) {
      throw new HttpError(401, "Nao autorizado");
    }

    const useCase = new DeleteUserUseCase({
      userRepository: new PostgresUserRepository()
    });

    try {
      await useCase.execute(params.userId, currentUser.id);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(404, "Usuario nao encontrado");
    }

    return reply.status(204).send();
  });

  app.patch("/users/:userId/password", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const params = request.params as { userId: string };
    const body = request.body as { password: string };

    if (!body.password || body.password.length < 6) {
      throw new HttpError(400, "Senha deve ter pelo menos 6 caracteres");
    }

    const userRepo = new PostgresUserRepository();
    const user = await userRepo.findById(params.userId);

    if (!user) {
      throw new HttpError(404, "Usuario nao encontrado");
    }

    const passwordHasher = new BcryptPasswordHasher();
    const newPasswordHash = await passwordHasher.hash(body.password);

    await userRepo.update({
      ...user,
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    });

    return reply.status(200).send({ success: true });
  });
};

export default userRoutes;
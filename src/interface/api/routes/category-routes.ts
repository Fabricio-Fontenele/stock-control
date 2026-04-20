import type { FastifyPluginAsync } from "fastify";

import { CreateCategoryUseCase } from "../../../application/use-cases/create-category.use-case.js";
import { ListCategoriesUseCase } from "../../../application/use-cases/list-categories.use-case.js";
import { UpdateCategoryUseCase } from "../../../application/use-cases/update-category.use-case.js";
import { PostgresCategoryRepository } from "../../../infrastructure/repositories/postgres-category-repository.js";
import { categoryCreateSchema, categoryIdParamSchema, categoryUpdateSchema } from "../schemas/catalog-schemas.js";
import { presentCategory } from "../../presenters/http-presenters.js";

const categoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/categories", { preHandler: app.ensureAdmin }, async (_request, reply) => {
    const useCase = new ListCategoriesUseCase({
      categoryRepository: new PostgresCategoryRepository()
    });

    const items = await useCase.execute();
    return reply.status(200).send({
      items: items.map((item) => presentCategory(item))
    });
  });

  app.post("/categories", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const payload = categoryCreateSchema.parse(request.body);
    const useCase = new CreateCategoryUseCase({
      categoryRepository: new PostgresCategoryRepository()
    });

    const category = await useCase.execute({
      name: payload.name,
      description: payload.description ?? null
    });
    return reply.status(201).send(presentCategory(category));
  });

  app.patch("/categories/:categoryId", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const params = categoryIdParamSchema.parse(request.params);
    const payload = categoryUpdateSchema.parse(request.body);
    const useCase = new UpdateCategoryUseCase({
      categoryRepository: new PostgresCategoryRepository()
    });

    const category = await useCase.execute({
      categoryId: params.categoryId,
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {})
    });

    return reply.status(200).send(presentCategory(category));
  });
};

export default categoryRoutes;

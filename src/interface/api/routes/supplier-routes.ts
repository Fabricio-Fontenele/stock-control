import type { FastifyPluginAsync } from "fastify";

import { CreateSupplierUseCase } from "../../../application/use-cases/create-supplier.use-case.js";
import { ListSuppliersUseCase } from "../../../application/use-cases/list-suppliers.use-case.js";
import { UpdateSupplierUseCase } from "../../../application/use-cases/update-supplier.use-case.js";
import { PostgresSupplierRepository } from "../../../infrastructure/repositories/postgres-supplier-repository.js";
import { presentSupplier } from "../../presenters/http-presenters.js";
import { supplierCreateSchema, supplierIdParamSchema, supplierUpdateSchema } from "../schemas/catalog-schemas.js";

const supplierRoutes: FastifyPluginAsync = async (app) => {
  app.get("/suppliers", { preHandler: app.ensureAdmin }, async (_request, reply) => {
    const useCase = new ListSuppliersUseCase({
      supplierRepository: new PostgresSupplierRepository()
    });

    const items = await useCase.execute();
    return reply.status(200).send({
      items: items.map((item) => presentSupplier(item))
    });
  });

  app.post("/suppliers", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const payload = supplierCreateSchema.parse(request.body);
    const useCase = new CreateSupplierUseCase({
      supplierRepository: new PostgresSupplierRepository()
    });

    const supplier = await useCase.execute({
      name: payload.name,
      document: payload.document ?? null,
      contactName: payload.contactName ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null
    });
    return reply.status(201).send(presentSupplier(supplier));
  });

  app.patch("/suppliers/:supplierId", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const params = supplierIdParamSchema.parse(request.params);
    const payload = supplierUpdateSchema.parse(request.body);
    const useCase = new UpdateSupplierUseCase({
      supplierRepository: new PostgresSupplierRepository()
    });

    const supplier = await useCase.execute({
      supplierId: params.supplierId,
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.document !== undefined ? { document: payload.document } : {}),
      ...(payload.contactName !== undefined ? { contactName: payload.contactName } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {})
    });

    return reply.status(200).send(presentSupplier(supplier));
  });
};

export default supplierRoutes;

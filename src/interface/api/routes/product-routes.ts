import type { FastifyPluginAsync } from "fastify";

import { CreateProductUseCase } from "../../../application/use-cases/create-product.use-case.js";
import { UpdateProductUseCase } from "../../../application/use-cases/update-product.use-case.js";
import { ListProductsUseCase } from "../../../application/use-cases/list-products.use-case.js";
import { GetProductDetailUseCase } from "../../../application/use-cases/get-product-detail.use-case.js";
import { DeactivateProductUseCase } from "../../../application/use-cases/deactivate-product.use-case.js";
import { PostgresProductRepository } from "../../../infrastructure/repositories/postgres-product-repository.js";
import { PostgresCategoryRepository } from "../../../infrastructure/repositories/postgres-category-repository.js";
import { PostgresSupplierRepository } from "../../../infrastructure/repositories/postgres-supplier-repository.js";
import { PostgresStockRepository } from "../../../infrastructure/repositories/postgres-stock-repository.js";
import {
  productCreateSchema,
  productIdParamSchema,
  productListQuerySchema,
  productUpdateSchema
} from "../schemas/product-schemas.js";
import { presentProduct, presentProductDetail } from "../../presenters/http-presenters.js";

const productRoutes: FastifyPluginAsync = async (app) => {
  app.get("/products", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const query = productListQuerySchema.parse(request.query);
    const useCase = new ListProductsUseCase({
      productRepository: new PostgresProductRepository(),
      stockRepository: new PostgresStockRepository()
    });

    const items = await useCase.execute({
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.status !== undefined ? { status: query.status } : {})
    });
    return reply.status(200).send({
      items: items.map((item) => presentProduct(item))
    });
  });

  app.post("/products", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const payload = productCreateSchema.parse(request.body);
    const useCase = new CreateProductUseCase({
      productRepository: new PostgresProductRepository(),
      categoryRepository: new PostgresCategoryRepository(),
      supplierRepository: new PostgresSupplierRepository()
    });

    const product = await useCase.execute(payload);
    return reply.status(201).send(presentProduct(product));
  });

  app.get("/products/:productId", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const params = productIdParamSchema.parse(request.params);
    const useCase = new GetProductDetailUseCase({
      productRepository: new PostgresProductRepository(),
      stockRepository: new PostgresStockRepository()
    });

    const product = await useCase.execute(params.productId);
    return reply.status(200).send(presentProductDetail(product));
  });

  app.patch("/products/:productId", { preHandler: app.ensureAdmin }, async (request, reply) => {
    const params = productIdParamSchema.parse(request.params);
    const payload = productUpdateSchema.parse(request.body);
    const useCase = new UpdateProductUseCase({
      productRepository: new PostgresProductRepository(),
      categoryRepository: new PostgresCategoryRepository(),
      supplierRepository: new PostgresSupplierRepository()
    });

    const product = await useCase.execute({
      productId: params.productId,
      ...(payload.sku !== undefined ? { sku: payload.sku } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId } : {}),
      ...(payload.supplierId !== undefined ? { supplierId: payload.supplierId } : {}),
      ...(payload.purchasePrice !== undefined ? { purchasePrice: payload.purchasePrice } : {}),
      ...(payload.salePrice !== undefined ? { salePrice: payload.salePrice } : {}),
      ...(payload.unitOfMeasure !== undefined ? { unitOfMeasure: payload.unitOfMeasure } : {}),
      ...(payload.minimumStock !== undefined ? { minimumStock: payload.minimumStock } : {}),
      ...(payload.tracksExpiration !== undefined
        ? { tracksExpiration: payload.tracksExpiration }
        : {})
    });

    return reply.status(200).send(presentProduct(product));
  });

  app.post(
    "/products/:productId/deactivate",
    { preHandler: app.ensureAdmin },
    async (request, reply) => {
      const params = productIdParamSchema.parse(request.params);
      const useCase = new DeactivateProductUseCase({
        productRepository: new PostgresProductRepository()
      });

      const product = await useCase.execute(params.productId);
      return reply.status(200).send(presentProduct(product));
    }
  );
};

export default productRoutes;

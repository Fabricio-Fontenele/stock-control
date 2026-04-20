import fp from "fastify-plugin";
import { ZodError } from "zod";

interface ValidationErrorLike {
  validation?: unknown;
  statusCode?: number;
  message?: string;
}

const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler((error, request, reply) => {
    const appError = error as ValidationErrorLike;

    request.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: "Validation error",
        details: error.issues
      });
    }

    if (appError.validation) {
      return reply.status(400).send({
        message: "Validation error",
        details: appError.validation
      });
    }

    if (appError.statusCode && appError.statusCode < 500) {
      return reply.status(appError.statusCode).send({ message: appError.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  });
});

export default errorHandlerPlugin;

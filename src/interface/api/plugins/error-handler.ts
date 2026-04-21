import fp from "fastify-plugin";
import { ZodError } from "zod";

interface ValidationErrorLike {
  validation?: unknown;
  statusCode?: number;
  message?: string;
  code?: string;
}

const JWT_ERROR_MESSAGES: Record<string, string> = {
  FST_JWT_NO_AUTHORIZATION_IN_HEADER: "Authentication token is required",
  FST_JWT_AUTHORIZATION_TOKEN_EXPIRED: "Authentication token expired",
  FST_JWT_AUTHORIZATION_TOKEN_INVALID: "Authentication token is invalid",
  FST_JWT_BAD_REQUEST: "Authentication token is invalid",
  FST_JWT_BAD_COOKIE_REQUEST: "Authentication token is invalid"
};

const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler((error, request, reply) => {
    const appError = error as ValidationErrorLike;

    const jwtMessage = appError.code ? JWT_ERROR_MESSAGES[appError.code] : undefined;

    if (jwtMessage) {
      request.log.warn(
        {
          code: appError.code,
          path: request.url
        },
        "request.rejected.jwt"
      );

      return reply.status(401).send({ message: jwtMessage });
    }

    if ((appError.statusCode ?? 500) < 500) {
      request.log.warn(error);
    } else {
      request.log.error(error);
    }

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

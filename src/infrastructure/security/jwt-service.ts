import type { FastifyInstance } from "fastify";

import type { UserRole } from "../../domain/entities/user.js";
import { loadEnv } from "../config/env.js";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface JwtService {
  sign(app: FastifyInstance, payload: AuthTokenPayload): Promise<string>;
  verify(app: FastifyInstance, token: string): Promise<AuthTokenPayload>;
}

export class FastifyJwtService implements JwtService {
  private readonly env = loadEnv();

  async sign(app: FastifyInstance, payload: AuthTokenPayload): Promise<string> {
    return app.jwt.sign(payload, {
      expiresIn: this.env.JWT_EXPIRES_IN
    });
  }

  async verify(app: FastifyInstance, token: string): Promise<AuthTokenPayload> {
    return app.jwt.verify<AuthTokenPayload>(token);
  }
}

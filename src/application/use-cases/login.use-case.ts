import type { LoginInput, AuthenticatedUserToken } from "../dto/auth-dto.js";
import type { UserRepository } from "../ports/user-repository.js";
import type { PasswordHasherPort } from "../ports/password-hasher.js";
import { isUserActive } from "../../domain/entities/user.js";
import { HttpError } from "../errors/http-error.js";

export interface TokenPayload {
  sub: string;
  email: string;
  role: "admin" | "employee";
}

interface LoginDependencies {
  userRepository: UserRepository;
  passwordHasher: PasswordHasherPort;
}

export class LoginUseCase {
  constructor(private readonly deps: LoginDependencies) {}

  async execute(
    input: LoginInput,
    signToken: (payload: TokenPayload) => Promise<string>
  ): Promise<AuthenticatedUserToken> {
    const email = input.email.trim().toLowerCase();
    const user = await this.deps.userRepository.findByEmail(email);

    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    if (!isUserActive(user)) {
      throw new HttpError(403, "Inactive user");
    }

    const passwordMatches = await this.deps.passwordHasher.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new HttpError(401, "Invalid credentials");
    }

    const accessToken = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }
}

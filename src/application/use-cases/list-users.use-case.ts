import type { UserRepository } from "../ports/user-repository.js";

interface ListUsersDependencies {
  userRepository: UserRepository;
}

export class ListUsersUseCase {
  constructor(private readonly deps: ListUsersDependencies) {}

  async execute(): Promise<{ id: string; name: string; email: string; role: string; status: string }[]> {
    const users = await this.deps.userRepository.list();

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status
    }));
  }
}
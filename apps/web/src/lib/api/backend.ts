import { getSession } from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_STOCK_CONTROL_API_URL ?? "http://localhost:3000";

export class BackendError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export interface BackendRequestOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: BackendRequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !(options.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (options.authenticated) {
    const session = await getSession();

    if (!session) {
      throw new BackendError(401, "Sessao nao encontrada");
    }

    headers.set("authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new BackendError(response.status, body?.message ?? "Falha na requisicao");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

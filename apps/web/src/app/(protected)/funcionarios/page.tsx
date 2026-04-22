import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { PasswordField } from "@/components/password-field";
import { UsersIcon } from "@/components/ui-icons";
import { apiFetch, BackendError } from "@/lib/api/backend";
import { requireAdminSession } from "@/lib/auth/guards";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  status: "active" | "inactive";
}

function toRedirectErrorPath(message: string): Route {
  return `/funcionarios?error=${encodeURIComponent(message)}` as Route;
}

function resolveBackendMessage(error: unknown, fallback: string): string {
  if (error instanceof BackendError) {
    return error.message;
  }
  return fallback;
}

async function createUserAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleValue = String(formData.get("role") ?? "employee");
  const role = roleValue === "admin" ? "admin" : "employee";

  if (!name || !email || !password) {
    redirect(toRedirectErrorPath("Dados incompletos"));
  }

  if (password.length < 6) {
    redirect(toRedirectErrorPath("Senha deve ter pelo menos 6 caracteres"));
  }

  try {
    await apiFetch("/users", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ name, email, password, role })
    });

    revalidatePath("/funcionarios");
    redirect("/funcionarios?success=created" as Route);
  } catch (error) {
    redirect(toRedirectErrorPath(resolveBackendMessage(error, "Falha ao criar usuario")));
  }
}

async function deleteUserAction(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    redirect(toRedirectErrorPath("Usuario invalido"));
  }

  try {
    await apiFetch(`/users/${userId}`, {
      method: "DELETE",
      authenticated: true
    });

    revalidatePath("/funcionarios");
    redirect("/funcionarios?success=deleted" as Route);
  } catch (error) {
    redirect(toRedirectErrorPath(resolveBackendMessage(error, "Falha ao excluir usuario")));
  }
}

async function changePasswordAction(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId) {
    redirect(toRedirectErrorPath("Usuario invalido"));
  }

  if (!password || password.length < 6) {
    redirect(toRedirectErrorPath("Senha deve ter pelo menos 6 caracteres"));
  }

  try {
    await apiFetch(`/users/${userId}/password`, {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify({ password })
    });

    revalidatePath("/funcionarios");
    redirect("/funcionarios?success=password" as Route);
  } catch (error) {
    redirect(toRedirectErrorPath(resolveBackendMessage(error, "Falha ao alterar senha")));
  }
}

function UserCard({ user }: { user: UserItem }) {
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#16353f] text-white shadow-sm">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-950">{user.name}</h3>
            <p className="mt-0.5 text-sm text-slate-600">{user.email}</p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            user.role === "admin"
              ? "bg-amber-200 text-amber-800"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {user.role}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
            user.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {user.status === "active" ? "Ativo" : "Inativo"}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {user.role !== "admin" ? (
            <form action={deleteUserAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Excluir
              </button>
            </form>
          ) : null}

          <form action={changePasswordAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={user.id} />
            <PasswordField
              name="password"
              placeholder="Nova senha"
              className="w-40 rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
            >
              Salvar
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

export default async function FuncionariosPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireAdminSession();

  const [params, usersResponse] = await Promise.all([
    searchParams,
    apiFetch<{ items: UserItem[] }>("/users", { authenticated: true })
  ]);
  const users = usersResponse.items;

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-900/10 bg-white/70 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-semibold text-slate-950">Funcionarios</h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {users.length} cadastrados
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Gerencie contas de acesso e redefina senhas sem sair do painel administrativo.
        </p>
      </header>

      {params.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      {params.success === "created" ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Funcionario criado com sucesso.
        </div>
      ) : null}
      {params.success === "deleted" ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Funcionario excluido com sucesso.
        </div>
      ) : null}
      {params.success === "password" ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Senha atualizada com sucesso.
        </div>
      ) : null}

      <form
        action={createUserAction}
        className="grid gap-3 rounded-3xl border border-slate-900/10 bg-white/90 p-6 shadow-sm md:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1fr_auto_auto]"
      >
        <input
          name="name"
          required
          placeholder="Nome completo"
          className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="E-mail"
          className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
        />
        <PasswordField
          name="password"
          placeholder="Senha"
          className="rounded-2xl border border-slate-300 px-4 py-3 text-sm"
        />
        <select name="role" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm">
          <option value="employee">Funcionario</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="rounded-2xl bg-[#9f2f2f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#842626]"
        >
          Adicionar
        </button>
      </form>

      <div className="grid gap-4 xl:grid-cols-2">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </section>
  );
}

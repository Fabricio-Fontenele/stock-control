import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { EmptyState } from "@/components/empty-state";
import { requireAdminSession } from "@/lib/auth/guards";
import { ToastNotice } from "@/components/toast-notice";
import type { CategoryView } from "@/lib/api/types";

async function createCategoryAction(formData: FormData) {
  "use server";

  try {
    await apiFetch("/categories", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "") || null
      })
    });

    revalidatePath("/categorias");
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao criar categoria";
    redirect(`/categorias?error=${encodeURIComponent(message)}`);
  }

  redirect("/categorias?success=created");
}

async function updateCategoryAction(formData: FormData) {
  "use server";

  const categoryId = String(formData.get("categoryId") ?? "");

  try {
    await apiFetch(`/categories/${categoryId}`, {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "") || null
      })
    });

    revalidatePath("/categorias");
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao atualizar categoria";
    redirect(`/categorias?error=${encodeURIComponent(message)}`);
  }

  redirect("/categorias?success=updated");
}

export default async function CategoriasPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireAdminSession();

  const [{ items }, params] = await Promise.all([
    apiFetch<{ items: CategoryView[] }>("/categories", { authenticated: true }),
    searchParams
  ]);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold">Categorias</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Gestao das classificacoes comerciais usadas pelo catalogo.
        </p>
      </header>

      {params.error ? <ToastNotice tone="error" message={params.error} /> : null}
      {params.success === "created" ? (
        <ToastNotice tone="success" message="Categoria criada com sucesso." />
      ) : null}
      {params.success === "updated" ? (
        <ToastNotice tone="success" message="Categoria atualizada com sucesso." />
      ) : null}

      <form action={createCategoryAction} className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <input name="name" required placeholder="Nova categoria" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <input name="description" placeholder="Descricao" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <button type="submit" className="rounded-2xl bg-[#9f2f2f] px-5 py-3 font-semibold text-white transition hover:bg-[#842626]">
          Criar
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria cadastrada"
          description="Crie a primeira categoria para organizar melhor os produtos da conveniencia."
        />
      ) : null}

      <div className="space-y-4">
        {items.map((item) => (
          <form
            key={item.id}
            action={updateCategoryAction}
            className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-[1fr_1fr_auto]"
          >
            <input type="hidden" name="categoryId" value={item.id} />
            <input name="name" defaultValue={item.name} required className="rounded-2xl border border-slate-300 px-4 py-3" />
            <input name="description" defaultValue={item.description ?? ""} className="rounded-2xl border border-slate-300 px-4 py-3" />
            <button type="submit" className="rounded-2xl border border-slate-900/10 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
              Atualizar
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}

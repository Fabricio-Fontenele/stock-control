import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { EmptyState } from "@/components/empty-state";
import { requireAdminSession } from "@/lib/auth/guards";
import { ToastNotice } from "@/components/toast-notice";
import { BoxIcon } from "@/components/ui-icons";
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

async function deleteCategoryAction(formData: FormData) {
  "use server";

  const categoryId = String(formData.get("categoryId") ?? "");

  try {
    await apiFetch<undefined>(`/categories/${categoryId}`, {
      method: "DELETE",
      authenticated: true
    });

    revalidatePath("/categorias");
    redirect("/categorias?success=deleted");
  } catch (error) {
    const errorMessage = String(error);

    if (errorMessage.includes("NEXT_REDIRECT")) {
      throw error;
    }

    const message =
      error instanceof BackendError ? error.message : "Falha ao excluir categoria";
    redirect(`/categorias?error=${encodeURIComponent(message)}`);
  }
}

interface CategoryCardProps {
  category: CategoryView;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16353f] text-white">
            <BoxIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950">{category.name}</h3>
            {category.description && (
              <p className="mt-0.5 text-xs text-slate-500">{category.description}</p>
            )}
          </div>
        </div>

        <form action={deleteCategoryAction}>
          <input type="hidden" name="categoryId" value={category.id} />
          <button
            type="submit"
            className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            Excluir
          </button>
        </form>
      </div>
    </div>
  );
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
      <header className="rounded-[1.75rem] border border-slate-900/10 bg-white/65 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold">Categorias</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Gestao das classificacoes comerciais.
        </p>
      </header>

      {params.error ? <ToastNotice tone="error" message={params.error} /> : null}
      {params.success === "created" ? (
        <ToastNotice tone="success" message="Categoria criada com sucesso." />
      ) : null}
      {params.success === "updated" ? (
        <ToastNotice tone="success" message="Categoria atualizada com sucesso." />
      ) : null}
      {params.success === "deleted" ? (
        <ToastNotice tone="success" message="Categoria excluida com sucesso." />
      ) : null}

      <form action={createCategoryAction} className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <input name="name" required placeholder="Nova categoria" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <input name="description" placeholder="Descricao" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <button type="submit" className="rounded-2xl bg-[#9f2f2f] px-5 py-3 font-semibold text-white transition hover:bg-[#842626]">
          Criar categoria
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
          <CategoryCard key={item.id} category={item} />
        ))}
      </div>
    </section>
  );
}
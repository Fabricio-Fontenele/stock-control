import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { EmptyState } from "@/components/empty-state";
import { requireAdminSession } from "@/lib/auth/guards";
import { ToastNotice } from "@/components/toast-notice";
import type { SupplierView } from "@/lib/api/types";

async function createSupplierAction(formData: FormData) {
  "use server";

  try {
    await apiFetch("/suppliers", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        document: String(formData.get("document") ?? "") || null,
        contactName: String(formData.get("contactName") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        email: String(formData.get("email") ?? "") || null
      })
    });

    revalidatePath("/fornecedores");
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao criar fornecedor";
    redirect(`/fornecedores?error=${encodeURIComponent(message)}`);
  }

  redirect("/fornecedores?success=created");
}

async function updateSupplierAction(formData: FormData) {
  "use server";

  const supplierId = String(formData.get("supplierId") ?? "");

  try {
    await apiFetch(`/suppliers/${supplierId}`, {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        document: String(formData.get("document") ?? "") || null,
        contactName: String(formData.get("contactName") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        email: String(formData.get("email") ?? "") || null
      })
    });

    revalidatePath("/fornecedores");
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao atualizar fornecedor";
    redirect(`/fornecedores?error=${encodeURIComponent(message)}`);
  }

  redirect("/fornecedores?success=updated");
}

export default async function FornecedoresPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireAdminSession();

  const [{ items }, params] = await Promise.all([
    apiFetch<{ items: SupplierView[] }>("/suppliers", { authenticated: true }),
    searchParams
  ]);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold">Fornecedores</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Cadastro e manutencao dos fornecedores usados nas entradas de estoque.
        </p>
      </header>

      {params.error ? <ToastNotice tone="error" message={params.error} /> : null}
      {params.success === "created" ? (
        <ToastNotice tone="success" message="Fornecedor criado com sucesso." />
      ) : null}
      {params.success === "updated" ? (
        <ToastNotice tone="success" message="Fornecedor atualizado com sucesso." />
      ) : null}

      <form action={createSupplierAction} className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <input name="name" required placeholder="Nome" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <input name="document" placeholder="Documento" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <input name="contactName" placeholder="Contato" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <input name="phone" placeholder="Telefone" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <div className="flex gap-3 xl:col-span-5">
          <input name="email" type="email" placeholder="E-mail" className="flex-1 rounded-2xl border border-slate-300 px-4 py-3" />
          <button type="submit" className="rounded-2xl bg-[#9f2f2f] px-5 py-3 font-semibold text-white transition hover:bg-[#842626]">
            Criar
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum fornecedor cadastrado"
          description="Cadastre um fornecedor para viabilizar entradas por lote com origem rastreavel."
        />
      ) : null}

      <div className="space-y-4">
        {items.map((item) => (
          <form
            key={item.id}
            action={updateSupplierAction}
            className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-2 xl:grid-cols-5"
          >
            <input type="hidden" name="supplierId" value={item.id} />
            <input name="name" defaultValue={item.name} required className="rounded-2xl border border-slate-300 px-4 py-3" />
            <input name="document" defaultValue={item.document ?? ""} className="rounded-2xl border border-slate-300 px-4 py-3" />
            <input name="contactName" defaultValue={item.contactName ?? ""} className="rounded-2xl border border-slate-300 px-4 py-3" />
            <input name="phone" defaultValue={item.phone ?? ""} className="rounded-2xl border border-slate-300 px-4 py-3" />
            <div className="flex gap-3 xl:col-span-5">
              <input name="email" type="email" defaultValue={item.email ?? ""} className="flex-1 rounded-2xl border border-slate-300 px-4 py-3" />
              <button type="submit" className="rounded-2xl border border-slate-900/10 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100">
                Atualizar
              </button>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}

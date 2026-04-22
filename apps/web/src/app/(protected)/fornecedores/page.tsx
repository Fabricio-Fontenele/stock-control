import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { requireAdminSession } from "@/lib/auth/guards";
import { ToastNotice } from "@/components/toast-notice";
import { EmptyState } from "@/components/empty-state";
import { UsersIcon } from "@/components/ui-icons";
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

async function deleteSupplierAction(formData: FormData) {
  "use server";

  const supplierId = String(formData.get("supplierId") ?? "");

  try {
    await apiFetch<undefined>(`/suppliers/${supplierId}`, {
      method: "DELETE",
      authenticated: true
    });

    revalidatePath("/fornecedores");
    redirect("/fornecedores?success=deleted");
  } catch (error) {
    const errorMessage = String(error);

    if (errorMessage.includes("NEXT_REDIRECT")) {
      throw error;
    }

    const message =
      error instanceof BackendError ? error.message : "Falha ao excluir fornecedor";
    redirect(`/fornecedores?error=${encodeURIComponent(message)}`);
  }
}

interface SupplierCardProps {
  supplier: SupplierView;
}

function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16353f] text-white">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950">{supplier.name}</h3>
            {supplier.document && (
              <p className="mt-0.5 text-xs text-slate-500">CNPJ/CPF: {supplier.document}</p>
            )}
          </div>
        </div>

        <form action={deleteSupplierAction}>
          <input type="hidden" name="supplierId" value={supplier.id} />
          <button
            type="submit"
            className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            Excluir
          </button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        {supplier.contactName && (
          <div>
            <span className="text-xs text-slate-500">Contato</span>
            <p className="font-medium text-slate-800">{supplier.contactName}</p>
          </div>
        )}
        {supplier.phone && (
          <div>
            <span className="text-xs text-slate-500">Telefone</span>
            <p className="font-medium text-slate-800">{supplier.phone}</p>
          </div>
        )}
        {supplier.email && (
          <div>
            <span className="text-xs text-slate-500">E-mail</span>
            <p className="font-medium text-slate-800">{supplier.email}</p>
          </div>
        )}
      </div>
    </div>
  );
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
      <header className="rounded-[1.75rem] border border-slate-900/10 bg-white/65 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold">Fornecedores</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Cadastro e manutencao dos fornecedores.
        </p>
      </header>

      {params.error ? <ToastNotice tone="error" message={params.error} /> : null}
      {params.success === "created" ? (
        <ToastNotice tone="success" message="Fornecedor criado com sucesso." />
      ) : null}
      {params.success === "deleted" ? (
        <ToastNotice tone="success" message="Fornecedor excluido com sucesso." />
      ) : null}

      <form action={createSupplierAction} className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <input name="name" required placeholder="Nome" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <input name="document" placeholder="CNPJ/CPF" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <input name="contactName" placeholder="Nome do contato" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <input name="phone" placeholder="Telefone" className="rounded-2xl border border-slate-300 px-4 py-3" />
        <div className="flex gap-3 xl:col-span-5">
          <input name="email" type="email" placeholder="E-mail" className="flex-1 rounded-2xl border border-slate-300 px-4 py-3" />
          <button type="submit" className="rounded-2xl bg-[#9f2f2f] px-5 py-3 font-semibold text-white transition hover:bg-[#842626]">
            Criar fornecedor
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum fornecedor cadastrado"
          description="Cadastre um fornecedor para viabilizar entradas."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}
    </section>
  );
}
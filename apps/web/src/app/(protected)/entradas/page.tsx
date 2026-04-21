import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { requireAdminSession } from "@/lib/auth/guards";
import { ToastNotice } from "@/components/toast-notice";
import type { ProductView } from "@/lib/api/types";

async function createEntryAction(formData: FormData) {
  "use server";

  try {
    await apiFetch("/inventory/entries", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({
        productId: String(formData.get("productId") ?? ""),
        lotCode: String(formData.get("lotCode") ?? "") || null,
        reasonType: String(formData.get("reasonType") ?? ""),
        quantity: Number(formData.get("quantity") ?? 0),
        entryDate: new Date(String(formData.get("entryDate") ?? "")).toISOString(),
        expirationDate: formData.get("expirationDate")
          ? new Date(String(formData.get("expirationDate"))).toISOString()
          : null,
        notes: String(formData.get("notes") ?? "") || null
      })
    });

    revalidatePath("/entradas");
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao registrar entrada";
    redirect(`/entradas?error=${encodeURIComponent(message)}`);
  }

  redirect("/entradas?success=created");
}

export default async function EntradasPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireAdminSession();

  const [{ items: products }, params] = await Promise.all([
    apiFetch<{ items: ProductView[] }>("/products?status=active", { authenticated: true }),
    searchParams
  ]);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold">Entradas por lote</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Fluxo administrativo para registrar entradas por lote e validade.
        </p>
      </header>

      {params.error ? <ToastNotice tone="error" message={params.error} /> : null}
      {params.success === "created" ? (
        <ToastNotice tone="success" message="Entrada registrada com sucesso." />
      ) : null}

      <form action={createEntryAction} className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-800">Produto</span>
          <select name="productId" required className="w-full rounded-2xl border border-slate-300 px-4 py-3">
            <option value="">Selecione</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.sku} - {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">Codigo do lote</span>
          <input name="lotCode" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">Tipo de entrada</span>
          <select name="reasonType" required className="w-full rounded-2xl border border-slate-300 px-4 py-3">
            <option value="supplier-purchase">Compra de fornecedor</option>
            <option value="restock">Reposicao</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">Quantidade</span>
          <input name="quantity" type="number" step="0.01" required className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">Data de entrada</span>
          <input name="entryDate" type="datetime-local" required className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">Validade</span>
          <input name="expirationDate" type="datetime-local" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-800">Observacoes</span>
          <textarea name="notes" rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="rounded-2xl bg-[#9f2f2f] px-5 py-3 font-semibold text-white transition hover:bg-[#842626]">
            Registrar entrada
          </button>
        </div>
      </form>
    </section>
  );
}

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { requireAdminSession } from "@/lib/auth/guards";
import { FeedbackBanner } from "@/components/feedback-banner";
import { ArrowOutIcon, BoxIcon } from "@/components/ui-icons";
import type { ProductStockView } from "@/lib/api/types";

async function createEntryAction(formData: FormData) {
  "use server";

  try {
    await apiFetch("/inventory/entries", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({
        productId: String(formData.get("productId") ?? ""),
        reasonType: String(formData.get("reasonType") ?? ""),
        quantity: Number(formData.get("quantity") ?? 0),
        entryDate: new Date().toISOString(),
        notes: String(formData.get("notes") ?? "") || null
      })
    });

    revalidatePath("/entradas");
    revalidatePath("/estoque");
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao registrar entrada";
    redirect(`/estoque?movementStatus=error&movementMessage=${encodeURIComponent(message)}`);
  }

  redirect("/estoque?movementStatus=success&movementMessage=Entrada%20registrada%20com%20sucesso.");
}

interface EntradasPageProps {
  searchParams: Promise<{
    productId?: string;
  }>;
}

export default async function EntradasPage({ searchParams }: EntradasPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const productId = params.productId;

  let product: ProductStockView | null = null;
  let loadError: string | null = null;

  if (productId) {
    try {
      const response = await apiFetch<{ items: ProductStockView[] }>(
        "/inventory/stock",
        { authenticated: true }
      );
      product = response.items.find((p) => p.id === productId) ?? null;

      if (!product) {
        loadError = "Produto nao encontrado no estoque.";
      }
    } catch (error) {
      if (error instanceof BackendError && error.status === 401) {
        redirect("/login");
      }
      loadError = "Nao foi possivel carregar o produto.";
    }
  }

  return (
    <section className="space-y-6">
      <header className="hero-card p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold">Entrada de estoque</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Registrar entrada de unidades no estoque.
        </p>
      </header>

      {loadError ? <FeedbackBanner tone="error">{loadError}</FeedbackBanner> : null}

      {product ? (
        <form
          action={createEntryAction}
          className="surface-card grid gap-4 p-6 md:grid-cols-2"
        >
          <input type="hidden" name="productId" value={product.id} />

          <div className="md:col-span-2 rounded-2xl bg-[#16353f] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-200">
              Produto selecionado
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{product.name}</h2>
            <p className="mt-1 text-sm text-slate-200">
              {product.sku} · saldo atual {product.availableQuantity}
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">
              Tipo de entrada
            </span>
            <select
              name="reasonType"
              required
              defaultValue="supplier-purchase"
              className="w-full rounded-2xl px-4 py-3"
            >
              <option value="supplier-purchase">Compra de fornecedor</option>
              <option value="restock">Reposicao</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">Quantidade</span>
            <input
              name="quantity"
              type="number"
              step="1"
              min="1"
              required
              className="w-full rounded-2xl px-4 py-3"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-800">
              Observacoes
            </span>
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded-2xl px-4 py-3"
              placeholder="Opcional"
            />
          </label>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="btn-accent inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold"
            >
              <ArrowOutIcon className="h-4 w-4" />
              Registrar entrada
            </button>
            <Link
              href="/estoque"
              className="btn-ghost rounded-2xl px-5 py-3 text-sm font-semibold text-slate-800"
            >
              Voltar para estoque
            </Link>
          </div>
        </form>
      ) : (
        <div className="rounded-[1.75rem] bg-[linear-gradient(165deg,#163b44_0%,#0f2f36_100%)] p-6 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-200">
            Fluxo operacional
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200/90">
            O caminho principal parte da listagem de estoque. Clique em
            &quot;Entrada&quot; em um produto para registrar a entrada.
          </p>
          <div className="mt-4">
            <Link
              href="/estoque"
              className="inline-flex rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Voltar para estoque
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

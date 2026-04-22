import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { FeedbackBanner } from "@/components/feedback-banner";
import type { ExitResponse, ProductStockView } from "@/lib/api/types";

async function createQuickExitAction(formData: FormData) {
  "use server";

  try {
    await apiFetch<ExitResponse>("/inventory/exits", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({
        productId: String(formData.get("productId") ?? ""),
        quantity: Number(formData.get("quantity") ?? 0),
        reasonType: String(formData.get("reasonType") ?? ""),
        notes: String(formData.get("notes") ?? "") || null
      })
    });

    revalidatePath("/estoque");
    revalidatePath("/estoque/saida");
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao registrar saida";
    redirect(`/estoque/saida?error=${encodeURIComponent(message)}`);
  }

  redirect("/estoque/saida?success=1");
}

interface SaidaRapidaPageProps {
  searchParams: Promise<{
    productId?: string;
    error?: string;
    success?: string;
  }>;
}

export default async function SaidaRapidaPage({ searchParams }: SaidaRapidaPageProps) {
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
      <header className="rounded-[1.75rem] border border-slate-900/10 bg-white/65 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Operacao</p>
        <h1 className="mt-2 text-3xl font-semibold">Registrar saida</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Registrar saida de unidades no estoque.
        </p>
      </header>

      {params.error ? (
        <FeedbackBanner tone="error">{params.error}</FeedbackBanner>
      ) : null}

      {params.success === "1" ? (
        <FeedbackBanner tone="success">Saida registrada com sucesso.</FeedbackBanner>
      ) : null}

      {loadError ? <FeedbackBanner tone="error">{loadError}</FeedbackBanner> : null}

      {product ? (
        <form
          action={createQuickExitAction}
          className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-2"
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
            <span className="mb-2 block text-sm font-medium text-slate-800">Tipo de saida</span>
            <select
              name="reasonType"
              required
              defaultValue="sale"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="sale">Venda</option>
              <option value="loss">Perda</option>
              <option value="breakage">Quebra</option>
              <option value="expiration">Vencimento</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">Quantidade</span>
            <input
              name="quantity"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-800">
              Observacoes
            </span>
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Opcional"
            />
          </label>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#9f2f2f] px-5 py-3 font-semibold text-white transition hover:bg-[#842626]"
            >
              Registrar saida
            </button>
            <Link
              href="/estoque"
              className="rounded-2xl border border-slate-900/10 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Voltar para estoque
            </Link>
          </div>
        </form>
      ) : (
        <div className="rounded-[1.75rem] bg-[#16353f] p-6 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-200">
            Fluxo operacional
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200/90">
            O caminho principal parte da listagem de estoque. Clique em
            &quot;Saida&quot; em um produto para registrar a saida.
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
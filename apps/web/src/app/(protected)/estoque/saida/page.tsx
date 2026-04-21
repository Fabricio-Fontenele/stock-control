import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { EmptyState } from "@/components/empty-state";
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
    search?: string;
    productId?: string;
    error?: string;
    success?: string;
  }>;
}

export default async function SaidaRapidaPage({
  searchParams
}: SaidaRapidaPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const selectedProductId = params.productId ?? "";

  let items: ProductStockView[] = [];
  let searchError: string | null = null;

  if (search) {
    try {
      const response = await apiFetch<{ items: ProductStockView[] }>(
        `/inventory/stock?search=${encodeURIComponent(search)}`,
        { authenticated: true }
      );

      items = response.items;
    } catch (error) {
      if (error instanceof BackendError && error.status === 401) {
        redirect("/login");
      }

      searchError = "Nao foi possivel consultar o produto para a saida.";
      items = [];
    }
  }

  const selectedProduct =
    items.find((item) => item.id === selectedProductId) ??
    (items.length === 1 ? items[0] : null);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Operacao</p>
        <h1 className="mt-2 text-3xl font-semibold">Registrar saida</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Finalize a saida do produto selecionado para venda, perda, quebra ou
          vencimento.
        </p>
      </header>

      {params.error ? (
        <FeedbackBanner tone="error">{params.error}</FeedbackBanner>
      ) : null}

      {params.success === "1" ? (
        <FeedbackBanner tone="success">Saida registrada com sucesso.</FeedbackBanner>
      ) : null}

      {searchError ? <FeedbackBanner tone="error">{searchError}</FeedbackBanner> : null}

      {selectedProduct ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-5 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Produto definido a partir do estoque
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Se precisar trocar o item, volte para a listagem de estoque ou use a busca abaixo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/estoque"
              className="rounded-2xl border border-slate-900/10 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Voltar para estoque
            </Link>
            <a
              href="#buscar-outro-produto"
              className="rounded-2xl bg-[#16353f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2a33]"
            >
              Trocar produto
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.75rem] bg-[#16353f] p-6 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-200">Fluxo operacional</p>
          <p className="mt-2 text-sm leading-6 text-slate-200/90">
            O caminho principal parte da listagem de estoque. Se voce chegou aqui sem
            selecionar um item, localize o produto por SKU ou nome e continue.
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

      <form
        id="buscar-outro-produto"
        className="rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm"
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            {selectedProduct ? "Trocar produto" : "Buscar produto"}
          </span>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              name="search"
              defaultValue={search}
              placeholder="Busque por SKU ou nome"
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#16353f]"
            />
            <button
              type="submit"
              className="rounded-2xl bg-[#16353f] px-5 py-3 font-semibold text-white transition hover:bg-[#0f2a33]"
            >
              Localizar
            </button>
          </div>
        </label>
      </form>

      {items.length > 0 && (!selectedProduct || items.length > 1) ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => {
            const query = new URLSearchParams();
            query.set("search", search);
            query.set("productId", item.id);

            return (
              <a
                key={item.id}
                href={`/estoque/saida?${query.toString()}`}
                className={`rounded-[1.75rem] border p-6 shadow-sm transition ${
                  item.id === selectedProduct?.id
                    ? "border-[#9f2f2f] bg-[#fff4ef]"
                    : "border-slate-900/10 bg-white/80 hover:bg-white"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.sku}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">{item.name}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#16353f] px-3 py-1 text-xs font-semibold text-white">
                    Saldo: {item.availableQuantity}
                  </span>
                  {item.belowMinimum ? (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      Abaixo do minimo
                    </span>
                  ) : null}
                  {item.hasExpiredLots ? (
                    <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                      Lotes vencidos
                    </span>
                  ) : null}
                </div>
              </a>
            );
          })}
        </div>
      ) : null}

      {selectedProduct ? (
        <form
          action={createQuickExitAction}
          className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-6 shadow-sm md:grid-cols-2"
        >
          <input type="hidden" name="productId" value={selectedProduct.id} />

          <div className="md:col-span-2 rounded-2xl bg-[#16353f] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-200">
              Produto selecionado
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{selectedProduct.name}</h2>
            <p className="mt-1 text-sm text-slate-200">
              {selectedProduct.sku} · saldo atual {selectedProduct.availableQuantity}
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
            <span className="mb-2 block text-sm font-medium text-slate-800">Observacoes</span>
            <textarea
              name="notes"
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Opcional"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-2xl bg-[#9f2f2f] px-5 py-3 font-semibold text-white transition hover:bg-[#842626]"
            >
              Registrar saida
            </button>
          </div>
        </form>
      ) : (
        <EmptyState
          title="Selecione um produto para continuar"
          description="Depois da busca, escolha um item para preencher o formulario de saida e registrar a movimentacao."
        />
      )}
    </section>
  );
}

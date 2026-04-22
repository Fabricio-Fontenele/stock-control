import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { apiFetch, BackendError } from "@/lib/api/backend";
import { getSession } from "@/lib/auth/session";
import { EmptyState } from "@/components/empty-state";
import { FeedbackBanner } from "@/components/feedback-banner";
import { ArrowOutIcon, PlusIcon, SearchIcon } from "@/components/ui-icons";
import type { ProductStockView } from "@/lib/api/types";

interface EstoquePageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
    pageSize?: string;
  }>;
}

const STOCK_PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

type StockSortBy = "name" | "availableQuantity" | "salePrice";
type StockSortOrder = "asc" | "desc";

function normalizeSortBy(value?: string): StockSortBy {
  if (value === "availableQuantity" || value === "salePrice") {
    return value;
  }

  return "name";
}

function normalizeSortOrder(value?: string): StockSortOrder {
  return value === "desc" ? "desc" : "asc";
}

function normalizePage(value?: string): number {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function normalizePageSize(value?: string): number {
  const pageSize = Number(value);

  if (!STOCK_PAGE_SIZE_OPTIONS.includes(pageSize as (typeof STOCK_PAGE_SIZE_OPTIONS)[number])) {
    return 20;
  }

  return pageSize;
}

function buildStockHref(params: {
  search?: string;
  sortBy: StockSortBy;
  sortOrder: StockSortOrder;
  page: number;
  pageSize: number;
}): Route {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  query.set("sortBy", params.sortBy);
  query.set("sortOrder", params.sortOrder);
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));

  return (`/estoque?${query.toString()}`) as Route;
}

function buildStockExitHref(params: {
  search?: string;
  productId: string;
  fallbackSku: string;
}): Route {
  const query = new URLSearchParams();
  query.set("productId", params.productId);
  query.set("search", params.search?.trim() || params.fallbackSku);

  return (`/estoque/saida?${query.toString()}`) as Route;
}

function buildStockEntryHref(productId: string): Route {
  return (`/entradas?productId=${productId}`) as Route;
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const sortBy = normalizeSortBy(params.sortBy);
  const sortOrder = normalizeSortOrder(params.sortOrder);
  const requestedPage = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const stockUrl = search
    ? `/inventory/stock?search=${encodeURIComponent(search)}`
    : "/inventory/stock";

  let items: ProductStockView[] = [];
  let errorMessage: string | null = null;

  try {
    const response = await apiFetch<{ items: ProductStockView[] }>(stockUrl, {
      authenticated: true
    });

    items = response.items;
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 401) {
        redirect("/login");
      }

      errorMessage = error.message;
    } else {
      errorMessage = "Falha ao consultar estoque";
    }
  }

  const session = await getSession();
  const isAdmin = session?.user.role === "admin";

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
  const sortedItems = [...items].sort((left, right) => {
    if (sortBy === "availableQuantity") {
      return sortOrder === "asc"
        ? left.availableQuantity - right.availableQuantity
        : right.availableQuantity - left.availableQuantity;
    }

    if (sortBy === "salePrice") {
      return sortOrder === "asc"
        ? left.salePrice - right.salePrice
        : right.salePrice - left.salePrice;
    }

    return sortOrder === "asc"
      ? left.name.localeCompare(right.name, "pt-BR")
      : right.name.localeCompare(left.name, "pt-BR");
  });
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedItems = sortedItems.slice(pageStart, pageStart + pageSize);
  const pageLabelStart = totalItems === 0 ? 0 : pageStart + 1;
  const pageLabelEnd = Math.min(pageStart + pageSize, totalItems);

  return (
    <section className="space-y-6">
      <header className="hero-card p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Operacao</p>
        <h1 className="mt-2 text-3xl font-semibold">Estoque</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Visualize o estoque atual, refine a lista por SKU ou nome e clique no
          produto para seguir direto ao registro de saida.
        </p>
      </header>

      <form className="surface-card p-6">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
            <SearchIcon className="h-4 w-4 text-[#16353f]" />
            Filtrar estoque
          </span>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_0.8fr_0.7fr_0.7fr_auto]">
            <input
              name="search"
              defaultValue={search}
              placeholder="Ex.: coca, cerveja, 000123"
              className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3"
            />
            <select
              name="sortBy"
              defaultValue={sortBy}
              className="rounded-2xl bg-white px-4 py-3"
            >
              <option value="name">Ordenar por nome</option>
              <option value="availableQuantity">Ordenar por quantidade</option>
              <option value="salePrice">Ordenar por valor</option>
            </select>
            <select
              name="sortOrder"
              defaultValue={sortOrder}
              className="rounded-2xl bg-white px-4 py-3"
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="rounded-2xl bg-white px-4 py-3"
            >
              {STOCK_PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} por pagina
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn-brand rounded-2xl px-5 py-3 font-semibold"
            >
              Consultar
            </button>
          </div>
        </label>
      </form>

      {errorMessage ? (
        <FeedbackBanner tone="error">{errorMessage}</FeedbackBanner>
      ) : null}

      {items.length === 0 && !errorMessage ? (
        <EmptyState
          title="Nenhum produto no estoque"
          description={
            search
              ? "O filtro nao retornou resultados. Tente outro SKU ou nome parcial."
              : "Nenhum produto ativo apareceu na listagem de estoque."
          }
          actionHref={buildStockHref({
            search: "",
            sortBy,
            sortOrder,
            page: 1,
            pageSize
          })}
          actionLabel="Limpar filtro"
        />
      ) : null}

      {items.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-900/10 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Lista operacional
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {totalItems} {totalItems === 1 ? "produto encontrado" : "produtos encontrados"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-500">
                {pageLabelStart}-{pageLabelEnd} de {totalItems}
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {paginatedItems.map((item) => {
              const exitHref = buildStockExitHref({
                search,
                productId: item.id,
                fallbackSku: item.sku
              });
              const isOutOfStock = item.availableQuantity <= 0;
              const isBelowMinimum = !isOutOfStock && item.availableQuantity < item.minimumStock;
              const mobileCardTone = isOutOfStock
                ? "border-red-200 bg-red-50/70"
                : isBelowMinimum
                  ? "border-amber-200 bg-amber-50/70"
                  : "border-slate-200 bg-white";
              const productNameTone = isOutOfStock
                ? "text-red-700"
                : isBelowMinimum
                  ? "text-amber-700"
                  : "text-slate-950";

              return (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 shadow-sm ${mobileCardTone}`}
                >
                  <Link href={exitHref} className="block">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.sku}</p>
                    <h3 className={`mt-1 text-base font-semibold ${productNameTone}`}>{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">Unidade: {item.unitOfMeasure}</p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Quantidade</p>
                      <p className="text-base font-semibold text-slate-900">{item.availableQuantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Venda</p>
                      <p className="text-base font-semibold text-slate-900">
                        {currencyFormatter.format(item.salePrice)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {isAdmin ? (
                      <Link
                        href={buildStockEntryHref(item.id)}
                        className="btn-brand inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Entrada
                      </Link>
                    ) : null}
                    <Link
                      href={exitHref}
                      className="btn-ghost inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <ArrowOutIcon className="h-3.5 w-3.5" />
                      Saida
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Codigo</th>
                  <th className="px-6 py-4 font-semibold">Produto</th>
                  <th className="px-6 py-4 font-semibold">Unidade</th>
                  <th className="px-6 py-4 font-semibold">Quantidade em estoque</th>
                  <th className="px-6 py-4 font-semibold">Valor de venda</th>
                  <th className="px-6 py-4 font-semibold">Ultima atualizacao</th>
                  <th className="px-6 py-4 font-semibold text-right">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => {
                  const exitHref = buildStockExitHref({
                    search,
                    productId: item.id,
                    fallbackSku: item.sku
                  });
                  const isOutOfStock = item.availableQuantity <= 0;
                  const isBelowMinimum = !isOutOfStock && item.availableQuantity < item.minimumStock;
                  const rowTone = isOutOfStock
                    ? "bg-red-50/60 hover:bg-red-100/70"
                    : isBelowMinimum
                      ? "bg-amber-50/60 hover:bg-amber-100/70"
                      : "hover:bg-slate-50/80";
                  const productNameTone = isOutOfStock
                    ? "text-red-700"
                    : isBelowMinimum
                      ? "text-amber-700"
                      : "text-slate-950";

                  return (
                  <tr key={item.id} className={`align-top transition ${rowTone}`}>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      <Link href={exitHref} className="block">
                        {item.sku}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={exitHref} className="block min-w-[14rem]">
                        <p className={`font-semibold ${productNameTone}`}>{item.name}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      <Link href={exitHref} className="block">
                        {item.unitOfMeasure}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={exitHref} className="block">
                        <div
                          className={`font-semibold ${
                            isOutOfStock
                              ? "text-red-700"
                              : isBelowMinimum
                                ? "text-amber-700"
                                : "text-slate-950"
                          }`}
                        >
                          {item.availableQuantity}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Minimo: {item.minimumStock}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      <Link href={exitHref} className="block">
                        {currencyFormatter.format(item.salePrice)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <Link href={exitHref} className="block">
                        {dateTimeFormatter.format(new Date(item.updatedAt))}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <Link
                            href={buildStockEntryHref(item.id)}
                            className="btn-brand inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold"
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
                            Entrada
                          </Link>
                        ) : null}
                        <Link
                          href={exitHref}
                          className="btn-ghost inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold"
                        >
                          <ArrowOutIcon className="h-3.5 w-3.5" />
                          Saida
                        </Link>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-900/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">
              Pagina {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-3">
              <Link
                aria-disabled={currentPage <= 1}
                href={buildStockHref({
                  search,
                  sortBy,
                  sortOrder,
                  page: Math.max(1, currentPage - 1),
                  pageSize
                })}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  currentPage <= 1
                    ? "pointer-events-none border border-slate-200 text-slate-300"
                    : "btn-ghost text-slate-900"
                }`}
              >
                Anterior
              </Link>
              <Link
                aria-disabled={currentPage >= totalPages}
                href={buildStockHref({
                  search,
                  sortBy,
                  sortOrder,
                  page: Math.min(totalPages, currentPage + 1),
                  pageSize
                })}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  currentPage >= totalPages
                    ? "pointer-events-none border border-slate-200 text-slate-300"
                    : "btn-ghost text-slate-900"
                }`}
              >
                Proxima
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

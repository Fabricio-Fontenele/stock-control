import type { Route } from "next";
import Link from "next/link";

import { apiFetch } from "@/lib/api/backend";
import { EmptyState } from "@/components/empty-state";
import { requireAdminSession } from "@/lib/auth/guards";
import { ToastNotice } from "@/components/toast-notice";
import { SearchIcon } from "@/components/ui-icons";
import type { ProductView } from "@/lib/api/types";

interface ProdutosPageProps {
  searchParams: Promise<{
    search?: string;
    status?: "active" | "inactive";
    sortBy?: string;
    sortOrder?: string;
    success?: string;
  }>;
}

type CatalogSortBy = "sku" | "name" | "salePrice" | "minimumStock" | "status";
type CatalogSortOrder = "asc" | "desc";
type CatalogStatusFilter = "active" | "inactive" | "";

function normalizeSortBy(value?: string): CatalogSortBy {
  if (
    value === "sku" ||
    value === "salePrice" ||
    value === "minimumStock" ||
    value === "status"
  ) {
    return value;
  }

  return "name";
}

function normalizeSortOrder(value?: string): CatalogSortOrder {
  return value === "desc" ? "desc" : "asc";
}

function buildCatalogHref(params: {
  search?: string;
  status: CatalogStatusFilter;
  sortBy: CatalogSortBy;
  sortOrder: CatalogSortOrder;
}): Route {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.status) {
    query.set("status", params.status);
  }

  query.set("sortBy", params.sortBy);
  query.set("sortOrder", params.sortOrder);

  return (`/produtos?${query.toString()}`) as Route;
}

function buildColumnSortHref(params: {
  search?: string;
  status: CatalogStatusFilter;
  currentSortBy: CatalogSortBy;
  currentSortOrder: CatalogSortOrder;
  targetSortBy: CatalogSortBy;
}): Route {
  const nextSortOrder: CatalogSortOrder =
    params.currentSortBy === params.targetSortBy && params.currentSortOrder === "asc"
      ? "desc"
      : "asc";

  return buildCatalogHref({
    search: params.search,
    status: params.status,
    sortBy: params.targetSortBy,
    sortOrder: nextSortOrder
  });
}

function renderSortLabel(
  activeSortBy: CatalogSortBy,
  activeSortOrder: CatalogSortOrder,
  column: CatalogSortBy,
  label: string
): string {
  if (activeSortBy !== column) {
    return label;
  }

  return activeSortOrder === "asc" ? `${label} ↑` : `${label} ↓`;
}

function resolveCatalogToastMessage(success?: string): string | null {
  if (success === "created") {
    return "Produto criado com sucesso.";
  }

  if (success === "updated") {
    return "Produto atualizado com sucesso.";
  }

  if (success === "deactivated") {
    return "Produto desativado com sucesso.";
  }

  if (success === "reactivated") {
    return "Produto reativado com sucesso.";
  }

  return null;
}

export default async function ProdutosPage({ searchParams }: ProdutosPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status: CatalogStatusFilter =
    params.status === "active" || params.status === "inactive" ? params.status : "";
  const sortBy = normalizeSortBy(params.sortBy);
  const sortOrder = normalizeSortOrder(params.sortOrder);
  const query = new URLSearchParams();

  if (search) {
    query.set("search", search);
  }

  if (status) {
    query.set("status", status);
  }

  const response = await apiFetch<{ items: ProductView[] }>(
    `/products?${query.toString()}`,
    { authenticated: true }
  );
  const items = [...response.items].sort((left, right) => {
    if (sortBy === "sku") {
      return sortOrder === "asc"
        ? left.sku.localeCompare(right.sku, "pt-BR")
        : right.sku.localeCompare(left.sku, "pt-BR");
    }

    if (sortBy === "salePrice") {
      return sortOrder === "asc"
        ? left.salePrice - right.salePrice
        : right.salePrice - left.salePrice;
    }

    if (sortBy === "minimumStock") {
      return sortOrder === "asc"
        ? left.minimumStock - right.minimumStock
        : right.minimumStock - left.minimumStock;
    }

    if (sortBy === "status") {
      return sortOrder === "asc"
        ? left.status.localeCompare(right.status, "pt-BR")
        : right.status.localeCompare(left.status, "pt-BR");
    }

    return sortOrder === "asc"
      ? left.name.localeCompare(right.name, "pt-BR")
      : right.name.localeCompare(left.name, "pt-BR");
  });
  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const toastMessage = resolveCatalogToastMessage(params.success);

  return (
    <section className="space-y-6">
      <header className="hero-card p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold">Catalogo</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          Gestao administrativa do catalogo principal, sem competir com a visao
          operacional do estoque.
        </p>
      </header>

      {toastMessage ? <ToastNotice tone="success" message={toastMessage} /> : null}

      <div className="surface-card flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
        <form className="grid flex-1 gap-3 md:grid-cols-[1fr_220px]">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
              <SearchIcon className="h-4 w-4 text-[#16353f]" />
              Buscar
            </span>
            <input
              name="search"
              defaultValue={search}
              placeholder="SKU ou nome"
              className="w-full rounded-2xl bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-800">Status</span>
            <select
              name="status"
              defaultValue={status}
              className="w-full rounded-2xl bg-white px-4 py-3"
            >
              <option value="">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </label>
          <button
            type="submit"
            className="btn-brand rounded-2xl px-5 py-3 font-semibold md:col-span-2 md:w-fit"
          >
            Filtrar
          </button>
        </form>

        <Link
          href={"/produtos/novo" as Route}
          className="btn-accent inline-flex rounded-2xl px-5 py-3 font-semibold"
        >
          Novo produto
        </Link>
      </div>

      {response.items.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="A lista atual nao tem produtos para os filtros informados. Crie um novo cadastro ou ajuste os filtros."
          actionHref={"/produtos/novo" as Route}
          actionLabel="Criar produto"
        />
      ) : null}

      {response.items.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-900/10 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Lista administrativa
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {items.length}{" "}
                {items.length === 1 ? "produto encontrado" : "produtos encontrados"}
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.sku}</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">{item.name}</h3>
                  </div>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <p>Unidade: {item.unitOfMeasure}</p>
                  <p className="text-right">{currencyFormatter.format(item.salePrice)}</p>
                  <p className="col-span-2 text-xs text-slate-500">Minimo: {item.minimumStock}</p>
                </div>
                <div className="mt-3">
                  <Link
                    href={`/produtos/${item.id}` as Route}
                    className="btn-ghost inline-flex rounded-2xl px-4 py-2 text-xs font-semibold text-slate-900"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    <Link
                      href={buildColumnSortHref({
                        search,
                        status,
                        currentSortBy: sortBy,
                        currentSortOrder: sortOrder,
                        targetSortBy: "sku"
                      })}
                      className="transition hover:text-slate-900"
                    >
                      {renderSortLabel(sortBy, sortOrder, "sku", "Codigo")}
                    </Link>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <Link
                      href={buildColumnSortHref({
                        search,
                        status,
                        currentSortBy: sortBy,
                        currentSortOrder: sortOrder,
                        targetSortBy: "name"
                      })}
                      className="transition hover:text-slate-900"
                    >
                      {renderSortLabel(sortBy, sortOrder, "name", "Produto")}
                    </Link>
                  </th>
                  <th className="px-6 py-4 font-semibold">Unidade</th>
                  <th className="px-6 py-4 font-semibold">
                    <Link
                      href={buildColumnSortHref({
                        search,
                        status,
                        currentSortBy: sortBy,
                        currentSortOrder: sortOrder,
                        targetSortBy: "salePrice"
                      })}
                      className="transition hover:text-slate-900"
                    >
                      {renderSortLabel(sortBy, sortOrder, "salePrice", "Valor de venda")}
                    </Link>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <Link
                      href={buildColumnSortHref({
                        search,
                        status,
                        currentSortBy: sortBy,
                        currentSortOrder: sortOrder,
                        targetSortBy: "minimumStock"
                      })}
                      className="transition hover:text-slate-900"
                    >
                      {renderSortLabel(sortBy, sortOrder, "minimumStock", "Estoque minimo")}
                    </Link>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <Link
                      href={buildColumnSortHref({
                        search,
                        status,
                        currentSortBy: sortBy,
                        currentSortOrder: sortOrder,
                        targetSortBy: "status"
                      })}
                      className="transition hover:text-slate-900"
                    >
                      {renderSortLabel(sortBy, sortOrder, "status", "Status")}
                    </Link>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="align-top transition hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-700">{item.sku}</td>
                    <td className="px-6 py-4">
                      <div className="min-w-[14rem]">
                        <p className="font-semibold text-slate-950">{item.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.unitOfMeasure}</td>
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      {currencyFormatter.format(item.salePrice)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.minimumStock}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase text-white">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/produtos/${item.id}` as Route}
                        className="btn-ghost inline-flex rounded-2xl px-4 py-2 text-sm font-semibold text-slate-900"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

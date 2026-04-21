import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { requireAdminSession } from "@/lib/auth/guards";
import { ProductForm } from "@/features/products/product-form";
import { ToastNotice } from "@/components/toast-notice";
import type { CategoryView, ProductView, SupplierView } from "@/lib/api/types";

async function updateProductAction(formData: FormData) {
  "use server";

  const productId = String(formData.get("productId") ?? "");

  try {
    await apiFetch(`/products/${productId}`, {
      method: "PATCH",
      authenticated: true,
        body: JSON.stringify({
        sku: String(formData.get("sku") ?? ""),
        name: String(formData.get("name") ?? ""),
        categoryId: String(formData.get("categoryId") ?? ""),
        supplierId: String(formData.get("supplierId") ?? "") || null,
        purchasePrice: Number(formData.get("purchasePrice") ?? 0),
        salePrice: Number(formData.get("salePrice") ?? 0),
        unitOfMeasure: String(formData.get("unitOfMeasure") ?? ""),
        minimumStock: Number(formData.get("minimumStock") ?? 0),
        tracksExpiration: formData.get("tracksExpiration") === "on"
      })
    });

    revalidatePath("/produtos");
    revalidatePath(`/produtos/${productId}`);
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao atualizar produto";
    redirect(`/produtos/${productId}?error=${encodeURIComponent(message)}` as Route);
  }

  redirect("/produtos?success=updated" as Route);
}

async function deactivateProductAction(formData: FormData) {
  "use server";

  const productId = String(formData.get("productId") ?? "");

  try {
    await apiFetch(`/products/${productId}/deactivate`, {
      method: "POST",
      authenticated: true
    });

    revalidatePath("/produtos");
    revalidatePath(`/produtos/${productId}`);
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao desativar produto";
    redirect(`/produtos/${productId}?error=${encodeURIComponent(message)}` as Route);
  }

  redirect("/produtos?success=deactivated" as Route);
}

async function reactivateProductAction(formData: FormData) {
  "use server";

  const productId = String(formData.get("productId") ?? "");

  try {
    await apiFetch(`/products/${productId}/reactivate`, {
      method: "POST",
      authenticated: true
    });

    revalidatePath("/produtos");
    revalidatePath(`/produtos/${productId}`);
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao reativar produto";
    redirect(`/produtos/${productId}?error=${encodeURIComponent(message)}` as Route);
  }

  redirect("/produtos?success=reactivated" as Route);
}

export default async function EditarProdutoPage({
  params,
  searchParams
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminSession();

  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const [product, categories, suppliers] = await Promise.all([
    apiFetch<ProductView>(`/products/${productId}`, { authenticated: true }),
    apiFetch<{ items: CategoryView[] }>("/categories", { authenticated: true }),
    apiFetch<{ items: SupplierView[] }>("/suppliers", { authenticated: true })
  ]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
          <h1 className="mt-2 text-3xl font-semibold">Editar produto</h1>
        </div>
        <Link
          href="/produtos"
          className="inline-flex rounded-2xl border border-slate-900/10 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Voltar para produtos
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-5 shadow-sm">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase text-white">
          {product.status}
        </span>
        <span className="text-sm text-slate-600">
          SKU atual: <strong className="text-slate-900">{product.sku}</strong>
        </span>
        {product.status === "active" ? (
          <form action={deactivateProductAction} className="ml-auto">
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              className="rounded-2xl bg-[#9f2f2f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#842626]"
            >
              Desativar produto
            </button>
          </form>
        ) : (
          <form action={reactivateProductAction} className="ml-auto">
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              className="rounded-2xl bg-[#16353f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2a33]"
            >
              Reativar produto
            </button>
          </form>
        )}
      </div>

      {query.error ? <ToastNotice tone="error" message={query.error} /> : null}

      <ProductForm
        categories={categories.items}
        suppliers={suppliers.items}
        submitLabel="Atualizar produto"
        initialProduct={product}
        onSubmit={updateProductAction}
      />
    </section>
  );
}

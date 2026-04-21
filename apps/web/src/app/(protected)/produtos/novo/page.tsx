import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { apiFetch, BackendError } from "@/lib/api/backend";
import { ToastNotice } from "@/components/toast-notice";
import { requireAdminSession } from "@/lib/auth/guards";
import { ProductForm } from "@/features/products/product-form";
import type { CategoryView, NextProductSkuView, SupplierView } from "@/lib/api/types";

async function createProductAction(formData: FormData) {
  "use server";

  try {
    await apiFetch("/products", {
      method: "POST",
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
  } catch (error) {
    const message =
      error instanceof BackendError ? error.message : "Falha ao criar produto";
    redirect(`/produtos/novo?error=${encodeURIComponent(message)}` as Route);
  }

  redirect("/produtos?success=created" as Route);
}

export default async function NovoProdutoPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminSession();

  const [{ items: categories }, { items: suppliers }, { sku }, params] = await Promise.all([
    apiFetch<{ items: CategoryView[] }>("/categories", { authenticated: true }),
    apiFetch<{ items: SupplierView[] }>("/suppliers", { authenticated: true }),
    apiFetch<NextProductSkuView>("/products/next-sku", { authenticated: true }),
    searchParams
  ]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#9f2f2f]">Administracao</p>
          <h1 className="mt-2 text-3xl font-semibold">Novo produto</h1>
        </div>
        <Link
          href="/produtos"
          className="inline-flex rounded-2xl border border-slate-900/10 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Voltar para produtos
        </Link>
      </header>

      {params.error ? <ToastNotice tone="error" message={params.error} /> : null}

      <ProductForm
        categories={categories}
        suppliers={suppliers}
        submitLabel="Salvar produto"
        initialSku={sku}
        onSubmit={createProductAction}
      />
    </section>
  );
}

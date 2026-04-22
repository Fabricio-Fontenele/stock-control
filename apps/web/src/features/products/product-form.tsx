"use client";

import { useState } from "react";

import type { CategoryView, ProductView, SupplierView } from "@/lib/api/types";

const UNIT_OPTIONS = [
  { value: "un", label: "Unidade" },
  { value: "cx", label: "Caixa" },
  { value: "pct", label: "Pacote" },
  { value: "kg", label: "Quilograma" },
  { value: "g", label: "Grama" },
  { value: "l", label: "Litro" },
  { value: "ml", label: "Mililitro" }
] as const;

interface ProductFormProps {
  categories: CategoryView[];
  suppliers: SupplierView[];
  submitLabel: string;
  initialProduct?: ProductView;
  initialSku?: string;
  onSubmit: (formData: FormData) => void | Promise<void>;
}

function calculateMargin(purchasePrice: number, salePrice: number): number {
  if (purchasePrice <= 0) {
    return 0;
  }

  return Number((((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(2));
}

function calculateSalePrice(purchasePrice: number, margin: number): number {
  if (purchasePrice <= 0) {
    return 0;
  }

  return Number((purchasePrice * (1 + margin / 100)).toFixed(2));
}

function formatDecimalInput(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  return String(value);
}

function parseDecimalInput(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const normalized = Number(value.replace(",", "."));
  return Number.isNaN(normalized) ? null : normalized;
}

export function ProductForm({
  categories,
  suppliers,
  submitLabel,
  initialProduct,
  initialSku,
  onSubmit
}: ProductFormProps) {
  const initialPurchasePrice = initialProduct?.purchasePrice ?? null;
  const initialSalePrice = initialProduct?.salePrice ?? null;
  const initialMargin =
    initialPurchasePrice !== null && initialSalePrice !== null
      ? calculateMargin(initialPurchasePrice, initialSalePrice)
      : null;

  const [purchasePrice, setPurchasePrice] = useState(
    formatDecimalInput(initialPurchasePrice)
  );
  const [margin, setMargin] = useState(formatDecimalInput(initialMargin));
  const [salePrice, setSalePrice] = useState(formatDecimalInput(initialSalePrice));

  const handlePurchasePriceChange = (nextPurchasePrice: string) => {
    setPurchasePrice(nextPurchasePrice);

    const parsedPurchasePrice = parseDecimalInput(nextPurchasePrice);
    const parsedMargin = parseDecimalInput(margin);
    const parsedSalePrice = parseDecimalInput(salePrice);

    if (parsedPurchasePrice === null) {
      return;
    }

    if (parsedMargin !== null) {
      setSalePrice(formatDecimalInput(calculateSalePrice(parsedPurchasePrice, parsedMargin)));
      return;
    }

    if (parsedSalePrice !== null) {
      setMargin(formatDecimalInput(calculateMargin(parsedPurchasePrice, parsedSalePrice)));
    }
  };

  const handleMarginChange = (nextMargin: string) => {
    setMargin(nextMargin);

    const parsedPurchasePrice = parseDecimalInput(purchasePrice);
    const parsedMargin = parseDecimalInput(nextMargin);

    if (parsedPurchasePrice === null || parsedMargin === null) {
      return;
    }

    setSalePrice(formatDecimalInput(calculateSalePrice(parsedPurchasePrice, parsedMargin)));
  };

  const handleSalePriceChange = (nextSalePrice: string) => {
    setSalePrice(nextSalePrice);

    const parsedPurchasePrice = parseDecimalInput(purchasePrice);
    const parsedSalePrice = parseDecimalInput(nextSalePrice);

    if (parsedPurchasePrice === null || parsedSalePrice === null) {
      return;
    }

    setMargin(formatDecimalInput(calculateMargin(parsedPurchasePrice, parsedSalePrice)));
  };

  return (
    <form
      action={onSubmit}
      className="surface-card grid gap-4 p-6 md:grid-cols-2"
    >
      {initialProduct ? (
        <input type="hidden" name="productId" value={initialProduct.id} />
      ) : null}

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-800">SKU</span>
        <input
          name="sku"
          defaultValue={initialProduct?.sku ?? initialSku ?? ""}
          required
          inputMode="numeric"
          className="w-full rounded-2xl px-4 py-3"
        />
        <span className="mt-2 block text-xs text-slate-500">
          Preenchido automaticamente em sequencia numerica, mas pode ser alterado antes de salvar.
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">Nome</span>
        <input
          name="name"
          defaultValue={initialProduct?.name ?? ""}
          required
          className="w-full rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">Categoria</span>
        <select
          name="categoryId"
          defaultValue={initialProduct?.categoryId ?? ""}
          required
          className="w-full rounded-2xl px-4 py-3"
        >
          <option value="">Selecione</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">Fornecedor</span>
        <select
          name="supplierId"
          defaultValue={initialProduct?.supplierId ?? ""}
          className="w-full rounded-2xl px-4 py-3"
        >
          <option value="">Sem fornecedor</option>
          {suppliers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">Unidade</span>
        <select
          name="unitOfMeasure"
          defaultValue={initialProduct?.unitOfMeasure ?? "un"}
          required
          className="w-full rounded-2xl px-4 py-3"
        >
          {UNIT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">Preco de custo</span>
        <input
          name="purchasePrice"
          type="number"
          step="0.01"
          min="0.01"
          value={purchasePrice}
          onChange={(event) => handlePurchasePriceChange(event.target.value)}
          placeholder="0,00"
          required
          className="w-full rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">Margem de lucro (%)</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={margin}
          onChange={(event) => handleMarginChange(event.target.value)}
          placeholder="0"
          required
          className="w-full rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">Preco final</span>
        <input
          name="salePrice"
          type="number"
          step="0.01"
          min="0.01"
          value={salePrice}
          onChange={(event) => handleSalePriceChange(event.target.value)}
          placeholder="0,00"
          required
          className="w-full rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">Estoque minimo</span>
        <input
          name="minimumStock"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialProduct?.minimumStock ?? ""}
          placeholder="0"
          required
          className="w-full rounded-2xl px-4 py-3"
        />
      </label>

      <label className="flex items-center gap-3 md:col-span-2">
        <input
          name="tracksExpiration"
          type="checkbox"
          defaultChecked={initialProduct?.tracksExpiration ?? false}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-slate-800">Controla validade por lote</span>
      </label>

      <div className="md:col-span-2">
        <button
          type="submit"
          className="btn-accent rounded-2xl px-5 py-3 font-semibold"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

import "dotenv/config";

import { randomUUID } from "node:crypto";

import { closePostgresPool, getPostgresPool } from "./connection.js";

interface SeedProduct {
  name: string;
  category: string;
  supplier: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  minimumStock: number;
  initialQuantity: number;
}

const START_SKU = 7894900000001n;

const products: SeedProduct[] = [
  { name: "Agua Mineral 500ml", category: "Bebidas", supplier: "Distribuidora Serra Azul", unit: "un", purchasePrice: 1.3, salePrice: 3.5, minimumStock: 30, initialQuantity: 120 },
  { name: "Agua Mineral 1,5L", category: "Bebidas", supplier: "Distribuidora Serra Azul", unit: "un", purchasePrice: 2.1, salePrice: 5.9, minimumStock: 20, initialQuantity: 80 },
  { name: "Refrigerante Cola Lata 350ml", category: "Bebidas", supplier: "Ambev Distribuicao", unit: "un", purchasePrice: 3.2, salePrice: 6.9, minimumStock: 25, initialQuantity: 110 },
  { name: "Refrigerante Guarana Lata 350ml", category: "Bebidas", supplier: "Ambev Distribuicao", unit: "un", purchasePrice: 3.1, salePrice: 6.5, minimumStock: 25, initialQuantity: 90 },
  { name: "Suco Laranja 1L", category: "Bebidas", supplier: "Frutal Nordeste", unit: "un", purchasePrice: 5.4, salePrice: 9.9, minimumStock: 12, initialQuantity: 48 },
  { name: "Energetico Lata 269ml", category: "Bebidas", supplier: "Energy Trade Brasil", unit: "un", purchasePrice: 6.5, salePrice: 11.9, minimumStock: 20, initialQuantity: 70 },
  { name: "Cafe Pronto 250ml", category: "Bebidas", supplier: "Distribuidora Serra Azul", unit: "un", purchasePrice: 4.0, salePrice: 8.5, minimumStock: 18, initialQuantity: 60 },
  { name: "Isotonico 500ml", category: "Bebidas", supplier: "Energy Trade Brasil", unit: "un", purchasePrice: 4.4, salePrice: 8.9, minimumStock: 16, initialQuantity: 55 },
  { name: "Salgadinho Milho 90g", category: "Snacks", supplier: "SnackMix Alimentos", unit: "un", purchasePrice: 3.0, salePrice: 7.5, minimumStock: 20, initialQuantity: 95 },
  { name: "Batata Chips 120g", category: "Snacks", supplier: "SnackMix Alimentos", unit: "un", purchasePrice: 4.2, salePrice: 9.5, minimumStock: 18, initialQuantity: 70 },
  { name: "Amendoim Torrado 150g", category: "Snacks", supplier: "SnackMix Alimentos", unit: "un", purchasePrice: 3.6, salePrice: 8.5, minimumStock: 16, initialQuantity: 64 },
  { name: "Biscoito Recheado 120g", category: "Snacks", supplier: "Doces e Cia Nordeste", unit: "un", purchasePrice: 2.2, salePrice: 5.5, minimumStock: 22, initialQuantity: 96 },
  { name: "Chocolate Barra 90g", category: "Snacks", supplier: "Doces e Cia Nordeste", unit: "un", purchasePrice: 3.4, salePrice: 7.9, minimumStock: 20, initialQuantity: 85 },
  { name: "Paocoquinha Unidade", category: "Snacks", supplier: "Doces e Cia Nordeste", unit: "un", purchasePrice: 0.9, salePrice: 2.5, minimumStock: 40, initialQuantity: 180 },
  { name: "Bala Sortida Pacote 600g", category: "Snacks", supplier: "Doces e Cia Nordeste", unit: "pct", purchasePrice: 11.0, salePrice: 21.9, minimumStock: 8, initialQuantity: 26 },
  { name: "Macarrao Instantaneo 80g", category: "Mercearia", supplier: "Atacado Bom Preco", unit: "un", purchasePrice: 1.4, salePrice: 3.9, minimumStock: 25, initialQuantity: 100 },
  { name: "Biscoito Agua e Sal 170g", category: "Mercearia", supplier: "Atacado Bom Preco", unit: "un", purchasePrice: 2.0, salePrice: 4.9, minimumStock: 18, initialQuantity: 68 },
  { name: "Pao de Forma 400g", category: "Mercearia", supplier: "Panificados Central", unit: "un", purchasePrice: 5.0, salePrice: 9.9, minimumStock: 10, initialQuantity: 32 },
  { name: "Queijo Processado Fatiado 150g", category: "Mercearia", supplier: "Laticinios Bom Sabor", unit: "un", purchasePrice: 5.8, salePrice: 11.5, minimumStock: 10, initialQuantity: 30 },
  { name: "Presunto Fatiado 200g", category: "Mercearia", supplier: "Laticinios Bom Sabor", unit: "un", purchasePrice: 7.0, salePrice: 13.9, minimumStock: 10, initialQuantity: 28 },
  { name: "Papel Toalha Rolo Duplo", category: "Higiene", supplier: "Casa e Higiene Distribuidora", unit: "un", purchasePrice: 3.2, salePrice: 7.4, minimumStock: 16, initialQuantity: 60 },
  { name: "Papel Higienico 4 Rolos", category: "Higiene", supplier: "Casa e Higiene Distribuidora", unit: "pct", purchasePrice: 5.2, salePrice: 11.9, minimumStock: 14, initialQuantity: 52 },
  { name: "Sabonete 90g", category: "Higiene", supplier: "Casa e Higiene Distribuidora", unit: "un", purchasePrice: 1.5, salePrice: 3.9, minimumStock: 24, initialQuantity: 90 },
  { name: "Escova Dental Macia", category: "Higiene", supplier: "Casa e Higiene Distribuidora", unit: "un", purchasePrice: 2.8, salePrice: 6.9, minimumStock: 16, initialQuantity: 58 },
  { name: "Creme Dental 90g", category: "Higiene", supplier: "Casa e Higiene Distribuidora", unit: "un", purchasePrice: 3.1, salePrice: 7.2, minimumStock: 16, initialQuantity: 54 },
  { name: "Limpador Parabrisa 500ml", category: "Automotivo", supplier: "AutoParts Express", unit: "un", purchasePrice: 7.5, salePrice: 15.9, minimumStock: 10, initialQuantity: 34 },
  { name: "Aditivo Radiador 1L", category: "Automotivo", supplier: "AutoParts Express", unit: "un", purchasePrice: 14.2, salePrice: 29.9, minimumStock: 8, initialQuantity: 24 },
  { name: "Fluido de Freio 500ml", category: "Automotivo", supplier: "AutoParts Express", unit: "un", purchasePrice: 9.8, salePrice: 20.9, minimumStock: 8, initialQuantity: 22 },
  { name: "Palheta Limpador Universal", category: "Automotivo", supplier: "AutoParts Express", unit: "un", purchasePrice: 12.0, salePrice: 25.9, minimumStock: 6, initialQuantity: 18 },
  { name: "Luva Descartavel Par", category: "Automotivo", supplier: "AutoParts Express", unit: "un", purchasePrice: 1.1, salePrice: 3.0, minimumStock: 30, initialQuantity: 120 }
];

const toSku = (index: number): string => (START_SKU + BigInt(index)).toString();

const run = async (): Promise<void> => {
  const pool = getPostgresPool();

  try {
    await pool.query("BEGIN");

    await pool.query(
      `
      TRUNCATE TABLE
        stock_rejected_movements,
        stock_movements,
        stock_lots,
        products,
        categories,
        suppliers
      RESTART IDENTITY CASCADE
      `
    );

    const categoryNames = [...new Set(products.map((item) => item.category))];
    const supplierNames = [...new Set(products.map((item) => item.supplier))];

    const categoryIds = new Map<string, string>();
    const supplierIds = new Map<string, string>();

    for (const categoryName of categoryNames) {
      const categoryId = randomUUID();
      await pool.query(
        `
        INSERT INTO categories (id, name, description, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        `,
        [categoryId, categoryName, `${categoryName} da conveniencia`]
      );
      categoryIds.set(categoryName, categoryId);
    }

    for (const supplierName of supplierNames) {
      const supplierId = randomUUID();
      await pool.query(
        `
        INSERT INTO suppliers (id, name, contact_name, phone, email, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
        [
          supplierId,
          supplierName,
          "Comercial",
          "(85) 3000-0000",
          `${supplierName.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@fornecedor.local`
        ]
      );
      supplierIds.set(supplierName, supplierId);
    }

    const adminUserQuery = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE role = 'admin'::user_role ORDER BY created_at ASC LIMIT 1"
    );

    if (!adminUserQuery.rows[0]?.id) {
      throw new Error("Nenhum usuario admin encontrado. Rode 'npm run db:seed:admin' antes.");
    }

    const adminUserId = adminUserQuery.rows[0].id;

    for (const [index, item] of products.entries()) {
      const productId = randomUUID();
      const lotId = randomUUID();
      const sku = toSku(index);
      const categoryId = categoryIds.get(item.category);
      const supplierId = supplierIds.get(item.supplier);

      if (!categoryId || !supplierId) {
        throw new Error(`Categoria ou fornecedor ausente para produto: ${item.name}`);
      }

      await pool.query(
        `
        INSERT INTO products (
          id, sku, name, category_id, supplier_id, purchase_price, sale_price,
          unit_of_measure, minimum_stock, tracks_expiration, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, 'active'::product_status, NOW(), NOW()
        )
        `,
        [
          productId,
          sku,
          item.name,
          categoryId,
          supplierId,
          item.purchasePrice,
          item.salePrice,
          item.unit,
          item.minimumStock
        ]
      );

      await pool.query(
        `
        INSERT INTO stock_lots (
          id, product_id, code, received_quantity, remaining_quantity,
          entry_date, expiration_date, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $4, CURRENT_DATE, NULL, 'available'::stock_lot_status, NOW(), NOW()
        )
        `,
        [lotId, productId, `LOTE-${sku.slice(-6)}`, item.initialQuantity]
      );

      await pool.query(
        `
        INSERT INTO stock_movements (
          id, product_id, lot_id, movement_type, reason_type, quantity,
          performed_by_user_id, approved_by_user_id, notes, occurred_at, created_at
        ) VALUES (
          $1, $2, $3, 'entry'::stock_movement_type, 'supplier-purchase'::stock_movement_reason, $4,
          $5, NULL, $6, NOW(), NOW()
        )
        `,
        [
          randomUUID(),
          productId,
          lotId,
          item.initialQuantity,
          adminUserId,
          "Carga inicial de catalogo realista"
        ]
      );
    }

    await pool.query(
      `
      SELECT setval(
        'product_sku_seq',
        (
          SELECT COALESCE(MAX(CAST(sku AS BIGINT)), 0) + 1
          FROM products
          WHERE sku ~ '^[0-9]+$'
        ),
        false
      )
      `
    );

    await pool.query("COMMIT");
    process.stdout.write(`Catalogo seed concluido com ${products.length} produtos.\n`);
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  } finally {
    await closePostgresPool();
  }
};

void run();

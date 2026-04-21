export const makeProductSupplierOptionalAndCreateSkuSequenceSql = `
CREATE SEQUENCE IF NOT EXISTS product_sku_seq START 1;

SELECT setval(
  'product_sku_seq',
  GREATEST(
    (
      SELECT COALESCE(MAX(CAST(sku AS INTEGER)), 0)
      FROM products
      WHERE sku ~ '^[0-9]+$'
    ),
    0
  ) + 1,
  false
);

ALTER TABLE products
  ALTER COLUMN supplier_id DROP NOT NULL;
`;

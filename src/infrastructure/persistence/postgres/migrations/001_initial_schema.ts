export const createInitialSchemaSql = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE product_status AS ENUM ('active', 'inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_lot_status') THEN
    CREATE TYPE stock_lot_status AS ENUM ('available', 'depleted', 'expired', 'blocked');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
    CREATE TYPE stock_movement_type AS ENUM ('entry', 'exit', 'adjustment', 'expired-release');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_reason') THEN
    CREATE TYPE stock_movement_reason AS ENUM (
      'supplier-purchase',
      'restock',
      'inventory-adjustment',
      'sale',
      'loss',
      'expiration',
      'breakage'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'employee');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'inactive');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT suppliers_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  purchase_price NUMERIC(12,2) NOT NULL,
  sale_price NUMERIC(12,2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  minimum_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  tracks_expiration BOOLEAN NOT NULL DEFAULT TRUE,
  status product_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_minimum_stock_non_negative CHECK (minimum_stock >= 0)
);

CREATE TABLE IF NOT EXISTS stock_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  code TEXT NOT NULL,
  received_quantity NUMERIC(12,3) NOT NULL,
  remaining_quantity NUMERIC(12,3) NOT NULL,
  entry_date DATE NOT NULL,
  expiration_date DATE,
  status stock_lot_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_lots_received_quantity_positive CHECK (received_quantity > 0),
  CONSTRAINT stock_lots_remaining_quantity_range CHECK (
    remaining_quantity >= 0 AND remaining_quantity <= received_quantity
  )
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  lot_id UUID REFERENCES stock_lots(id),
  movement_type stock_movement_type NOT NULL,
  reason_type stock_movement_reason NOT NULL,
  quantity NUMERIC(12,3) NOT NULL,
  performed_by_user_id UUID NOT NULL REFERENCES users(id),
  approved_by_user_id UUID REFERENCES users(id),
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_movements_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS stock_lots_product_id_idx ON stock_lots(product_id);
CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS stock_movements_occurred_at_idx ON stock_movements(occurred_at);

CREATE TABLE IF NOT EXISTS stock_rejected_movements (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  requested_quantity NUMERIC(12,3) NOT NULL,
  reason_type stock_movement_reason NOT NULL,
  attempted_by_user_id UUID NOT NULL REFERENCES users(id),
  attempted_at TIMESTAMPTZ NOT NULL,
  failure_reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_rejected_movements_requested_quantity_positive CHECK (requested_quantity > 0)
);

CREATE INDEX IF NOT EXISTS stock_rejected_movements_product_id_idx
  ON stock_rejected_movements(product_id);
CREATE INDEX IF NOT EXISTS stock_rejected_movements_attempted_at_idx
  ON stock_rejected_movements(attempted_at);
`;

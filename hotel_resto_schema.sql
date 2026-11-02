-- ============================================================
-- Hotel & Resto Management - PostgreSQL Schema
-- Compatible with the Next.js + Prisma project
-- ============================================================

BEGIN;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(100) NOT NULL UNIQUE,
  full_name  VARCHAR(100),
  password   VARCHAR(100) NOT NULL,
  enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- User <-> Role (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT    NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id              BIGSERIAL PRIMARY KEY,
  number          VARCHAR(10)   NOT NULL UNIQUE,
  type            VARCHAR(20)   NOT NULL,
  price_per_night DECIMAL(12,2) NOT NULL,
  status          VARCHAR(20)   NOT NULL DEFAULT 'AVAILABLE'
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id          BIGSERIAL PRIMARY KEY,
  room_id     BIGINT        NOT NULL REFERENCES rooms(id),
  guest_id    BIGINT        NOT NULL REFERENCES users(id),
  check_in    DATE          NOT NULL,
  check_out   DATE          NOT NULL,
  status      VARCHAR(20)   NOT NULL,
  total_price DECIMAL(12,2)
);

-- Dining tables
CREATE TABLE IF NOT EXISTS dining_tables (
  id     BIGSERIAL PRIMARY KEY,
  number INT NOT NULL UNIQUE,
  seats  INT NOT NULL
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  description VARCHAR(255),
  price       DECIMAL(12,2) NOT NULL,
  category    VARCHAR(50),
  available   BOOLEAN       NOT NULL DEFAULT TRUE
);

-- Food orders
CREATE TABLE IF NOT EXISTS food_orders (
  id               BIGSERIAL PRIMARY KEY,
  dining_table_id  BIGINT      NOT NULL REFERENCES dining_tables(id),
  waiter_id        BIGINT      REFERENCES users(id),
  guest_id         BIGINT      REFERENCES users(id),
  status           VARCHAR(20) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id            BIGSERIAL PRIMARY KEY,
  food_order_id BIGINT        NOT NULL REFERENCES food_orders(id) ON DELETE CASCADE,
  menu_item_id  BIGINT        NOT NULL REFERENCES menu_items(id),
  quantity      INT           NOT NULL,
  unit_price    DECIMAL(12,2) NOT NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id            BIGSERIAL PRIMARY KEY,
  food_order_id BIGINT        NOT NULL UNIQUE REFERENCES food_orders(id),
  cashier_id    BIGINT        REFERENCES users(id),
  amount        DECIMAL(12,2) NOT NULL,
  method        VARCHAR(20)   NOT NULL,
  paid_at       TIMESTAMPTZ   NOT NULL
);

-- Stock items
CREATE TABLE IF NOT EXISTS stock_items (
  id        BIGSERIAL PRIMARY KEY,
  name      VARCHAR(100)  NOT NULL UNIQUE,
  quantity  DECIMAL(12,2) NOT NULL,
  unit      VARCHAR(20),
  min_level DECIMAL(12,2),
  supplier  VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_room_id   ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id  ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status    ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_food_orders_status     ON food_orders(status);
CREATE INDEX IF NOT EXISTS idx_food_orders_table_id   ON food_orders(dining_table_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(food_order_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id     ON user_roles(user_id);

COMMIT;

-- ============================================================
-- Seed roles (data for users/password is better via Prisma seed)
-- ============================================================
INSERT INTO roles (name) VALUES
  ('ADMIN'),
  ('MANAGER'),
  ('RECEPTIONIST'),
  ('WAITER'),
  ('CHEF'),
  ('CASHIER'),
  ('STOCK_KEEPER'),
  ('GUEST')
ON CONFLICT (name) DO NOTHING;

-- After creating the tables, run from the Next.js project:
--   npm run db:seed
-- to insert demo users (password: password123) + sample data.

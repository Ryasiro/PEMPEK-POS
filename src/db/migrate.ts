import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

let migrated = false;

/**
 * Pushes schema to the local SQLite database on first launch.
 * Uses CREATE TABLE IF NOT EXISTS so it's safe to call repeatedly.
 */
export async function runMigrations() {
  if (migrated) return;
  migrated = true;

  const sqlite = SQLite.openDatabaseSync("pempekpos.db");
  const db = drizzle(sqlite, { schema });

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('eceran','paket')),
    price INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    deducts_vinegar INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'tunai' CHECK(payment_method IN ('tunai','qris','transfer')),
    note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'selesai' CHECK(status IN ('selesai','dibatalkan')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pre_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_contact TEXT DEFAULT '',
    pickup_date INTEGER NOT NULL,
    dp_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'menunggu' CHECK(status IN ('menunggu','diproses','siap','diambil','dibatalkan')),
    notes TEXT DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pre_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pre_order_id INTEGER NOT NULL REFERENCES pre_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  )`);

  console.log("[db] Migrations applied successfully");
}

export async function resetDatabase() {
  const sqlite = SQLite.openDatabaseSync("pempekpos.db");
  const db = drizzle(sqlite, { schema });
  db.run("DROP TABLE IF EXISTS pre_order_items");
  db.run("DROP TABLE IF EXISTS pre_orders");
  db.run("DROP TABLE IF EXISTS transaction_items");
  db.run("DROP TABLE IF EXISTS transactions");
  db.run("DROP TABLE IF EXISTS products");
  db.run("DROP TABLE IF EXISTS settings");
  migrated = false;
  await runMigrations();
}

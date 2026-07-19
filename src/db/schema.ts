import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── Products ────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["eceran", "paket"] }).notNull(),
  price: integer("price").notNull().default(0),
  description: text("description", { mode: "text" }).default(""),
  deductsVinegar: integer("deducts_vinegar", { mode: "boolean" }).notNull().default(false),
  stock: integer("stock").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

// ─── Transactions ────────────────────────────────────────────
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  total: integer("total").notNull().default(0),
  paymentMethod: text("payment_method", { enum: ["tunai", "qris", "transfer"] }).notNull().default("tunai"),
  note: text("note", { mode: "text" }).default(""),
  status: text("status", { enum: ["selesai", "dibatalkan"] }).notNull().default("selesai"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const transactionItems = sqliteTable("transaction_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: integer("price").notNull().default(0),
});

// ─── Pre-Orders ──────────────────────────────────────────────
export const preOrders = sqliteTable("pre_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  customerContact: text("customer_contact").default(""),
  pickupDate: integer("pickup_date", { mode: "timestamp" }).notNull(),
  dpAmount: integer("dp_amount").notNull().default(0),
  status: text("status", {
    enum: ["menunggu", "diproses", "siap", "diambil", "dibatalkan"],
  }).notNull().default("menunggu"),
  notes: text("notes", { mode: "text" }).default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const preOrderItems = sqliteTable("pre_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  preOrderId: integer("pre_order_id")
    .notNull()
    .references(() => preOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: integer("price").notNull().default(0),
});

// ─── Settings ────────────────────────────────────────────────
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

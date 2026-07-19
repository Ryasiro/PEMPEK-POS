import { eq } from "drizzle-orm";
import { getDatabase } from ".";
import { products, transactions, transactionItems, settings, preOrders, preOrderItems } from "./schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────
export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;
export type Transaction = InferSelectModel<typeof transactions>;
export type TransactionItem = InferSelectModel<typeof transactionItems>;
export type PreOrder = InferSelectModel<typeof preOrders>;
export type PreOrderItem = InferSelectModel<typeof preOrderItems>;

// ─── Product CRUD ───────────────────────────────────────
export function getProducts(): Product[] {
  const db = getDatabase();
  return db.select().from(products).all();
}

export function getProductById(id: number): Product | undefined {
  const db = getDatabase();
  return db.select().from(products).where(eq(products.id, id)).get();
}

export function createProduct(data: Omit<NewProduct, "id" | "createdAt" | "updatedAt">): Product {
  const db = getDatabase();
  const id = db.insert(products).values(data).returning({ id: products.id }).get()!.id;
  return getProductById(id)!;
}

export function updateProduct(
  id: number,
  data: Partial<Omit<NewProduct, "id" | "createdAt" | "updatedAt">>
): Product | undefined {
  const db = getDatabase();
  db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).run();
  return getProductById(id);
}

export function deleteProduct(id: number): boolean {
  const db = getDatabase();
  const result = db.delete(products).where(eq(products.id, id)).run();
  return result.changes > 0;
}

// ─── Settings ───────────────────────────────────────────
export function getSetting(key: string): string | undefined {
  const db = getDatabase();
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase();
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

// ─── Checkout ───────────────────────────────────────────
export interface CheckoutItem {
  productId: number;
  quantity: number;
}

export interface CheckoutResult {
  transaction: Transaction;
  items: TransactionItem[];
}

/**
 * Process a sale: create transaction, deduct vinegar stock if applicable.
 * Returns the created transaction and its items.
 */
export function processCheckout(
  items: CheckoutItem[],
  paymentMethod: "tunai" | "qris" | "transfer" = "tunai",
  note = ""
): CheckoutResult {
  const db = getDatabase();
  let total = 0;
  const txItems: { name: string; quantity: number; price: number; productId: number }[] = [];

  for (const item of items) {
    const product = db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .get();

    if (!product) {
      throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
    }

    const itemTotal = product.price * item.quantity;
    total += itemTotal;

    txItems.push({
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      productId: product.id,
    });

    // Deduct vinegar stock if product has it enabled
    if (product.deductsVinegar) {
      const newStock = Math.max(0, (product.stock ?? 0) - item.quantity);
      db.update(products)
        .set({ stock: newStock, updatedAt: new Date() })
        .where(eq(products.id, product.id))
        .run();
    }
  }

  // Create transaction
  const txId = db
    .insert(transactions)
    .values({ total, paymentMethod, note, status: "selesai" })
    .returning({ id: transactions.id })
    .get()!.id;

  // Create transaction items
  for (const item of txItems) {
    db.insert(transactionItems)
      .values({
        transactionId: txId,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })
      .run();
  }

  const transaction = db
    .select()
    .from(transactions)
    .where(eq(transactions.id, txId))
    .get()!;

  const itemRows = db
    .select()
    .from(transactionItems)
    .where(eq(transactionItems.transactionId, txId))
    .all();

  return { transaction, items: itemRows };
}

/**
 * Get today's transactions (since midnight local time).
 */
export function getTodayTransactions() {
  const db = getDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return db
    .select()
    .from(transactions)
    .all()
    .filter((tx) => tx.createdAt && tx.createdAt.getTime() >= startOfDay.getTime());
}

/**
 * Get revenue summary for a date range.
 */
export function getRevenueSummary(from: Date, to: Date) {
  const db = getDatabase();
  const all = db
    .select()
    .from(transactions)
    .all()
    .filter((tx) => {
      if (!tx.createdAt) return false;
      return tx.createdAt.getTime() >= from.getTime() && tx.createdAt.getTime() <= to.getTime();
    });

  const gross = all.reduce((sum, tx) => sum + tx.total, 0);
  const byMethod: Record<string, { count: number; total: number }> = {};
  for (const tx of all) {
    const m = tx.paymentMethod ?? "tunai";
    if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
    byMethod[m].count++;
    byMethod[m].total += tx.total;
  }

  // Products sold in this period
  const txIds = all.map((t) => t.id);
  let itemsSold = 0;
  if (txIds.length > 0) {
    for (const id of txIds) {
      const items = db.select().from(transactionItems).where(eq(transactionItems.transactionId, id)).all();
      itemsSold += items.reduce((s, i) => s + i.quantity, 0);
    }
  }

  // Active pre-orders (not completed/cancelled)
  const activePOs = db.select().from(preOrders).all()
    .filter((po) => po.status !== "diambil" && po.status !== "dibatalkan").length;

  return {
    gross,
    count: all.length,
    byMethod,
    itemsSold,
    activePOs,
    transactions: all.sort((a, b) => ((b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))),
  };
}

// ─── Pre-Order CRUD ────────────────────────────────────
export interface PreOrderInput {
  customerName: string;
  customerContact: string;
  pickupDate: Date;
  dpAmount: number;
  notes: string;
}

export function createPreOrder(
  input: PreOrderInput,
  items: { productId: number; quantity: number; price: number; name: string }[]
): PreOrder {
  const db = getDatabase();
  const poId = db
    .insert(preOrders)
    .values({
      customerName: input.customerName,
      customerContact: input.customerContact,
      pickupDate: input.pickupDate,
      dpAmount: input.dpAmount,
      status: "menunggu",
      notes: input.notes,
    })
    .returning({ id: preOrders.id })
    .get()!.id;

  for (const item of items) {
    db.insert(preOrderItems)
      .values({
        preOrderId: poId,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })
      .run();
  }

  return db.select().from(preOrders).where(eq(preOrders.id, poId)).get()!;
}

export function getPreOrders(): PreOrder[] {
  const db = getDatabase();
  return db.select().from(preOrders).orderBy(preOrders.pickupDate).all();
}

export function updatePreOrderStatus(id: number, status: "menunggu" | "diproses" | "siap" | "diambil" | "dibatalkan"): PreOrder | undefined {
  const db = getDatabase();
  db.update(preOrders).set({ status, updatedAt: new Date() }).where(eq(preOrders.id, id)).run();
  return db.select().from(preOrders).where(eq(preOrders.id, id)).get();
}

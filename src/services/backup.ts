import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { getDatabase } from "../db";
import * as schema from "../db/schema";

// ─── Types ──────────────────────────────────────────
export interface BackupData {
  version: 1;
  exportedAt: string;
  products: any[];
  transactions: any[];
  transactionItems: any[];
  preOrders: any[];
  preOrderItems: any[];
  settings: any[];
}

// ─── Export ─────────────────────────────────────────
export async function exportBackup(): Promise<string | null> {
  try {
    const db = getDatabase();

    const data: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      products: db.select().from(schema.products).all(),
      transactions: db.select().from(schema.transactions).all(),
      transactionItems: db.select().from(schema.transactionItems).all(),
      preOrders: db.select().from(schema.preOrders).all(),
      preOrderItems: db.select().from(schema.preOrderItems).all(),
      settings: db.select().from(schema.settings).all(),
    };

    const json = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `pempekpos-backup-${timestamp}.json`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Simpan Backup PempekPOS",
      });
    }

    return fileUri;
  } catch (err: any) {
    console.error("[backup] Export failed:", err);
    Alert.alert("Gagal Ekspor", err?.message ?? "Terjadi kesalahan");
    return null;
  }
}

// ─── Import ─────────────────────────────────────────
export async function importBackup(): Promise<boolean> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return false;
    }

    const uri = result.assets[0].uri;
    const json = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const data: BackupData = JSON.parse(json);

    if (!data.version || !data.products) {
      throw new Error("Format file backup tidak valid");
    }

    const db = getDatabase();

    // Clear existing data
    db.delete(schema.preOrderItems).run();
    db.delete(schema.preOrders).run();
    db.delete(schema.transactionItems).run();
    db.delete(schema.transactions).run();
    db.delete(schema.products).run();
    db.delete(schema.settings).run();

    // Import settings
    if (data.settings?.length) {
      for (const s of data.settings) {
        db.insert(schema.settings).values({ key: s.key, value: s.value ?? "" }).run();
      }
    }

    // Import products
    if (data.products?.length) {
      for (const p of data.products) {
        db.insert(schema.products).values({
          id: p.id,
          name: p.name,
          type: p.type,
          price: p.price,
          description: p.description ?? "",
          deductsVinegar: !!p.deducts_vinegar,
          stock: p.stock ?? 0,
          createdAt: p.created_at ? new Date(p.created_at) : new Date(),
          updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
        }).run();
      }
    }

    // Import transactions
    if (data.transactions?.length) {
      for (const t of data.transactions) {
        db.insert(schema.transactions).values({
          id: t.id,
          total: t.total,
          paymentMethod: t.payment_method ?? "tunai",
          note: t.note ?? "",
          status: t.status ?? "selesai",
          createdAt: t.created_at ? new Date(t.created_at) : new Date(),
        }).run();
      }
    }

    // Import transaction items
    if (data.transactionItems?.length) {
      for (const ti of data.transactionItems) {
        db.insert(schema.transactionItems).values({
          id: ti.id,
          transactionId: ti.transaction_id,
          productId: ti.product_id,
          name: ti.name,
          quantity: ti.quantity,
          price: ti.price,
        }).run();
      }
    }

    // Import pre-orders
    if (data.preOrders?.length) {
      for (const po of data.preOrders) {
        db.insert(schema.preOrders).values({
          id: po.id,
          customerName: po.customer_name,
          customerContact: po.customer_contact ?? "",
          pickupDate: new Date(po.pickup_date),
          dpAmount: po.dp_amount,
          status: po.status ?? "menunggu",
          notes: po.notes ?? "",
          createdAt: po.created_at ? new Date(po.created_at) : new Date(),
          updatedAt: po.updated_at ? new Date(po.updated_at) : new Date(),
        }).run();
      }
    }

    // Import pre-order items
    if (data.preOrderItems?.length) {
      for (const poi of data.preOrderItems) {
        db.insert(schema.preOrderItems).values({
          id: poi.id,
          preOrderId: poi.pre_order_id,
          productId: poi.product_id,
          name: poi.name,
          quantity: poi.quantity,
          price: poi.price,
        }).run();
      }
    }

    Alert.alert("Import Berhasil", "Data berhasil dipulihkan dari backup.");
    return true;
  } catch (err: any) {
    console.error("[backup] Import failed:", err);
    Alert.alert("Gagal Import", err?.message ?? "File backup rusak atau tidak kompatibel");
    return false;
  }
}

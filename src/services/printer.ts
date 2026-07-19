import ThermalPrinter from "react-native-thermal-printer";
import { Platform } from "react-native";
import { buildReceipt, flattenChunks, type ReceiptLine } from "./escpos";
import type { Transaction, TransactionItem } from "../db/service";

// ─── Interface ──────────────────────────────────────
export interface PrinterState {
  connected: boolean;
  deviceName?: string;
}

let printerState: PrinterState = { connected: false };

export function getPrinterState(): PrinterState {
  return { ...printerState };
}

// ─── Connection ─────────────────────────────────────
const PRINTER_CONFIG = {
  interface: Platform.OS === "ios" ? "wifi" : ("bluetooth" as any),
  ip: "",
  port: 9100,
  characterSet: "WINDOWS_1252",
  codePage: 0,
  beep: true as const,
};

/**
 * Attempt to connect to a Bluetooth printer.
 * - Android: uses BluetoothAdapter
 * - iOS: uses WiFi / Bluetooth
 */
export async function connectPrinter(deviceAddress?: string): Promise<boolean> {
  try {
    await ThermalPrinter?.printBluetooth?.({
      ...PRINTER_CONFIG,
      payload: new Uint8Array([0x1b, 0x40]).buffer as any, // just reset to test
    });
    printerState = { connected: true, deviceName: deviceAddress ?? "Printer" };
    return true;
  } catch {
    printerState = { connected: false };
    return false;
  }
}

// ─── Print receipt ─────────────────────────────────
export async function printTransactionReceipt(
  transaction: Transaction,
  items: TransactionItem[]
): Promise<boolean> {
  const lines: ReceiptLine[] = [
    { text: "STRUK PEMBELIAN", align: "center", bold: true, size: { w: 1, h: 1 } },
    { text: "" },
    { text: `No. #${transaction.id}`, align: "center" },
    { text: "" },
  ];

  for (const item of items) {
    const lineText = `${item.name} x${item.quantity}`;
    const priceText = `Rp ${(item.price * item.quantity).toLocaleString("id-ID")}`;
    lines.push({ text: `${lineText.padEnd(20)}${priceText.padStart(12)}`, align: "left" });
  }

  lines.push({ text: "" });
  lines.push({
    text: `TOTAL${" ".repeat(16)}Rp ${transaction.total.toLocaleString("id-ID")}`,
    bold: true,
    size: { w: 1, h: 0 },
    align: "left",
  });
  lines.push({ text: "" });
  lines.push({
    text: `Pembayaran: ${transaction.paymentMethod === "tunai" ? "Tunai" : transaction.paymentMethod === "qris" ? "QRIS" : "Transfer"}`,
    align: "left",
  });
  lines.push({ text: "" });
  lines.push({ text: "Terima kasih telah berbelanja!", align: "center" });

  return doPrint(lines);
}

// ─── Print PO slip ─────────────────────────────────
export async function printPOSlip(
  poId: number,
  customerName: string,
  pickupDate: Date,
  dpAmount: number,
  items: { name: string; quantity: number; price: number }[]
): Promise<boolean> {
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const lines: ReceiptLine[] = [
    { text: "PRE-ORDER", align: "center", bold: true, size: { w: 1, h: 1 } },
    { text: "" },
    { text: `PO #${poId}`, align: "center" },
    { text: "" },
    { text: `Pelanggan: ${customerName}`, align: "left" },
    { text: `Ambil: ${pickupDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })} ${pickupDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`, align: "left" },
    { text: "" },
  ];

  for (const item of items) {
    const line = `${item.name} x${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString("id-ID")}`;
    lines.push({ text: line, align: "left" });
  }

  lines.push({ text: "" });
  lines.push({ text: `Total: Rp ${total.toLocaleString("id-ID")}`, bold: true });
  lines.push({ text: `DP: Rp ${dpAmount.toLocaleString("id-ID")}`, align: "left" });
  if (dpAmount < total) {
    lines.push({ text: `Sisa: Rp ${(total - dpAmount).toLocaleString("id-ID")}`, align: "left" });
  }
  lines.push({ text: "" });
  lines.push({ text: "Harap simpan slip ini.", align: "center" });

  return doPrint(lines);
}

// ─── Internal ──────────────────────────────────────
async function doPrint(lines: ReceiptLine[]): Promise<boolean> {
  try {
    const receipt = {
      header: "PEMPEK POS",
      lines,
      footer: "www.pempekpos.app",
    };

    const chunks = buildReceipt(receipt);
    const payload = flattenChunks(chunks);

    await ThermalPrinter?.printBluetooth?.({
      ...PRINTER_CONFIG,
      payload: payload.buffer as any,
    });

    return true;
  } catch (err) {
    console.error("[printer] Print failed:", err);
    return false;
  }
}

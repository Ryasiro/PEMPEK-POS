// ─── ESC/POS Command Builder ───────────────────────
// Produces raw byte arrays for thermal printers (58mm / 80mm).
// Commands reference: ESC/POS standard.

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

// ─── Text alignment ────────────────────────────────
export const Align = {
  LEFT: cmd(ESC, 0x61, 0x00),
  CENTER: cmd(ESC, 0x61, 0x01),
  RIGHT: cmd(ESC, 0x61, 0x02),
} as const;

// ─── Character size ────────────────────────────────
export function setCharSize(width: number, height: number) {
  const w = Math.min(Math.max(width, 0), 7);
  const h = Math.min(Math.max(height, 0), 7);
  return cmd(GS, 0x21, (w << 4) | h);
}

// ─── Emphasis / bold ───────────────────────────────
export const Bold = {
  ON: cmd(ESC, 0x45, 0x01),
  OFF: cmd(ESC, 0x45, 0x00),
} as const;

// ─── Paper cut ─────────────────────────────────────
export const PaperCut = cmd(GS, 0x56, 0x00);

// ─── Feed lines ────────────────────────────────────
export function feed(lines: number) {
  return cmd(ESC, 0x64, lines);
}

// ─── Text encoding ─────────────────────────────────
export function text(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str + "\n");
}

// ─── Divider line ──────────────────────────────────
export function divider(char = "─", width = 32): Uint8Array {
  return text(char.repeat(width));
}

// ─── Build full receipt ────────────────────────────
export interface ReceiptLine {
  align?: "left" | "center" | "right";
  bold?: boolean;
  size?: { w: number; h: number };
  text: string;
}

export interface ReceiptData {
  header: string;
  lines: ReceiptLine[];
  footer?: string;
}

/** Assemble a complete receipt into ESC/POS byte commands. */
export function buildReceipt(data: ReceiptData): Uint8Array[] {
  const chunks: Uint8Array[] = [];

  // Initialize
  chunks.push(cmd(ESC, 0x40)); // ESC @ — reset printer

  // Header
  chunks.push(Align.CENTER);
  chunks.push(setCharSize(1, 1));
  chunks.push(Bold.ON);
  chunks.push(text(data.header));
  chunks.push(Bold.OFF);
  chunks.push(setCharSize(0, 0));
  chunks.push(divider("=", 32));
  chunks.push(text(`Tanggal: ${new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`));
  chunks.push(text(`Jam: ${new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`));
  chunks.push(divider("─", 32));

  // Body lines
  for (const line of data.lines) {
    if (line.align === "center") chunks.push(Align.CENTER);
    else if (line.align === "right") chunks.push(Align.RIGHT);
    else chunks.push(Align.LEFT);

    if (line.bold) chunks.push(Bold.ON);
    if (line.size) chunks.push(setCharSize(line.size.w, line.size.h));

    chunks.push(text(line.text));

    if (line.bold) chunks.push(Bold.OFF);
    if (line.size) chunks.push(setCharSize(0, 0));

    // Restore left alignment after center/right
    if (line.align && line.align !== "left") chunks.push(Align.LEFT);
  }

  // Footer
  chunks.push(divider("=", 32));
  if (data.footer) {
    chunks.push(Align.CENTER);
    chunks.push(text(data.footer));
  }

  // Cut
  chunks.push(feed(3));
  chunks.push(PaperCut);

  return chunks;
}

/** Flatten array of Uint8Array chunks into a single Uint8Array. */
export function flattenChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

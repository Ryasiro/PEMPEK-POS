# 🐟 PempekPOS

**Aplikasi Point of Sale (POS) mobile offline-first untuk UMKM kuliner pempek.**

Dibangun dengan React Native (Expo), SQLite (Drizzle ORM), dan ESC/POS Bluetooth thermal printing.

---

## ✨ Fitur

### 📦 Manajemen Produk
- CRUD produk dengan tipe **Eceran** (satuan) dan **Paket** (bundling)
- Harga, deskripsi, dan stok per produk
- **Pelacakan stok botol cuka** — toggle per produk, stok otomatis berkurang saat checkout

### 🛒 POS Checkout
- Grid produk 3 kolom — ketuk untuk tambah ke keranjang
- Atur jumlah item (+/-) atau hapus dari keranjang
- Pilih metode bayar: **Tunai** / **QRIS** / **Transfer**
- Kalkulasi total otomatis
- Stok cuka otomatis terpotong jika produk memiliki tracker cuka aktif

### 📋 Pre-Order (PO)
- Form PO terstruktur: nama pelanggan, kontak, tanggal & jam pickup, nominal DP, catatan khusus (misal: "cuka dipisah", "vacuum pack")
- Validasi input: format tanggal (YYYY-MM-DD), jam (HH:MM), minimum 1 item
- Status pembayaran: **Belum DP / DP / Lunas**

### 📊 Dashboard PO
- Daftar PO terurut: prioritas status + waktu pickup terdekat
- Transisi status: **Menunggu → Diproses → Siap → Diambil**
- Indikator overdue (merah) jika melewati jam pickup
- Catat pelunasan sisa bayar saat serah terima

### 🧾 Laporan Harian
- Filter rentang tanggal
- Ringkasan: total transaksi, pendapatan kotor, item terjual, PO aktif
- Breakdown per metode pembayaran (Tunai / QRIS / Transfer)
- Daftar transaksi detail

### 🖨️ Cetak Struk (Bluetooth Thermal)
- Driver ESC/POS untuk printer thermal 58mm / 80mm
- Layout struk transaksi (PempekPOS)
- Layout slip PO (nama pelanggan, jadwal pickup, DP, sisa bayar)

### 💾 Backup & Restore
- Ekspor seluruh database ke file JSON (via share sheet)
- Import / restore dari file backup
- Satu tombol untuk semua data (produk, transaksi, PO, setting)

---

## 🧱 Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| Framework | React Native (Expo SDK 54) |
| Bahasa | TypeScript |
| Database | SQLite (`expo-sqlite`) |
| ORM | Drizzle ORM |
| Icons | `@expo/vector-icons` (MaterialCommunityIcons) |
| Printer | `react-native-thermal-printer` (ESC/POS) |
| File System | `expo-file-system` / `expo-sharing` |
| Document Picker | `expo-document-picker` |

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js v18+ & npm
- Expo Go di HP (Android / iOS), atau emulator

### Install & Run

```bash
# Clone repo
git clone https://github.com/Ryasiro/PEMPEK-POS.git
cd PEMPEK-POS

# Install dependensi
npm install

# Jalankan Expo dev server
npx expo start
```

Setelah server jalan:
- **Scan QR code** → buka di Expo Go (HP)
- Tekan **`a`** → Android emulator
- Tekan **`i`** → iOS simulator

---

## 📁 Struktur Proyek

```
PEMPEK-POS/
├── App.tsx                      # Entry point + navigasi tab
├── app.json                     # Expo config
├── drizzle.config.ts            # Drizzle Kit config
├── src/
│   ├── components/
│   │   └── Icon.tsx             # Icon wrapper (string name type)
│   ├── db/
│   │   ├── schema.ts            # Drizzle ORM schema (6 tabel)
│   │   ├── index.ts             # Database singleton
│   │   ├── migrate.ts           # Migrasi SQLite
│   │   └── service.ts           # Service layer (CRUD + checkout)
│   ├── screens/
│   │   ├── CheckoutScreen.tsx    # POS utama (grid + cart)
│   │   ├── ProductScreen.tsx     # CRUD produk
│   │   ├── PreOrderScreen.tsx    # Form PO
│   │   ├── PODashboardScreen.tsx # Dashboard & fulfill PO
│   │   ├── ReconciliationScreen.tsx # Laporan harian
│   │   └── BackupScreen.tsx      # Backup & restore
│   ├── services/
│   │   ├── escpos.ts            # ESC/POS command builder
│   │   ├── printer.ts           # Bluetooth printer service
│   │   └── backup.ts            # Ekspor/impor database
│   └── theme/
│       └── index.ts             # Tema konsisten (warna, spacing, font)
├── drizzle/
│   └── 0000_whole_warbird.sql   # Migration file
└── tsconfig.json
```

---

## 🗄️ Skema Database

6 tabel dengan Drizzle ORM:

| Tabel | Keterangan |
|-------|-----------|
| `products` | Produk (eceran/paket), harga, stok cuka |
| `transactions` | Transaksi POS, total, metode bayar |
| `transaction_items` | Item per transaksi (denormalized) |
| `pre_orders` | Pre-order: pelanggan, pickup, DP, status |
| `pre_order_items` | Item per PO |
| `settings` | Key-value settings |

---

## 🖨️ ESC/POS Printer

Printer thermal Bluetooth 58mm/80mm dengan standar ESC/POS:

- **Reset & inisialisasi** printer
- **Teks align** (kiri, tengah, kanan)
- **Bold** dan **ukuran karakter**
- Divider, total, footer
- **Paper cut** otomatis

Untuk connect printer:
```ts
import { connectPrinter } from "./src/services/printer";
await connectPrinter("MAC:ADDRESS"); // Android
```

---

## 🧪 Cara Memulai (Pertama Kali)

1. Buka app → database otomatis terbuat
2. Buka tab **Produk** → **Tambah** produk pertama (Eceran atau Paket)
3. Balik ke tab **POS** → ketuk produk → atur jumlah → **Bayar**
4. Coba tab **PO** → **Buat PO Baru** → isi form → **Simpan**
5. Tab **Laporan** → lihat rekap harian
6. Tab **Backup** → ekspor database untuk amankan data

---

## 📄 Lisensi

Hak cipta © 2026 — Dibuat untuk UMKM kuliner pempek Indonesia 🇮🇩

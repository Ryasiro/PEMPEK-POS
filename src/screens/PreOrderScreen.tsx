import { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Icon from "../components/Icon";
import {
  createPreOrder,
  getProducts,
  type Product,
} from "../db/service";

interface CartPOItem {
  product: Product;
  quantity: number;
}

export default function PreOrderScreen() {
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dpAmount, setDpAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartPOItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [products] = useState<Product[]>(getProducts);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.id === productId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const dp = parseInt(dpAmount, 10) || 0;
  const paymentStatus = dp <= 0 ? "Belum DP" : dp >= total ? "Lunas" : "DP";

  const validate = (): string | null => {
    if (!customerName.trim()) return "Nama pelanggan harus diisi";
    if (!pickupDate.trim()) return "Tanggal jemput harus diisi";
    if (!pickupTime.trim()) return "Jam jemput harus diisi";
    if (cart.length === 0) return "Minimal 1 item pesanan";
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(pickupDate)) return "Format tanggal: YYYY-MM-DD";
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(pickupTime)) return "Format jam: HH:MM";
    const selectedDate = new Date(`${pickupDate}T${pickupTime}:00`);
    if (selectedDate.getTime() <= Date.now() - 60000) return "Tanggal/jam jemput harus setelah waktu sekarang";
    return null;
  };

  const save = () => {
    const error = validate();
    if (error) {
      Alert.alert("Validasi", error);
      return;
    }

    const [y, m, d] = pickupDate.split("-").map(Number);
    const [h, min] = pickupTime.split(":").map(Number);
    const pickup = new Date(y, m - 1, d, h, min);

    createPreOrder(
      {
        customerName: customerName.trim(),
        customerContact: customerContact.trim(),
        pickupDate: pickup,
        dpAmount: dp,
        notes: notes.trim(),
      },
      cart.map((c) => ({
        productId: c.product.id,
        quantity: c.quantity,
        price: c.product.price,
        name: c.product.name,
      }))
    );

    setSaved(true);
  };

  const reset = () => {
    setCustomerName("");
    setCustomerContact("");
    setPickupDate("");
    setPickupTime("");
    setDpAmount("");
    setNotes("");
    setCart([]);
    setSaved(false);
  };

  if (saved) {
    return (
      <View style={styles.screen}>
        <View style={styles.successBox}>
          <Icon name="check-circle" size={56} color="#4CAF50" />
          <Text style={styles.successTitle}>Pre-Order Disimpan</Text>
          <Text style={styles.successDetail}>
            {customerName} — {pickupDate} {pickupTime}
          </Text>
          <Text style={styles.successDetail}>
            Status Pembayaran: {paymentStatus}
            {dp > 0 ? ` (Rp ${dp.toLocaleString("id-ID")})` : ""}
          </Text>
          <Pressable onPress={reset} style={styles.newPoBtn}>
            <Text style={styles.newPoText}>Buat PO Baru</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Pre-Order Baru</Text>
      </View>

      {/* Customer info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Pelanggan</Text>
        <TextInput
          style={styles.input}
          placeholder="Nama pelanggan *"
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput
          style={styles.input}
          placeholder="No. telepon / WA (opsional)"
          keyboardType="phone-pad"
          value={customerContact}
          onChangeText={setCustomerContact}
        />
      </View>

      {/* Pickup schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jadwal Jemput</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Tanggal (YYYY-MM-DD) *"
            value={pickupDate}
            onChangeText={setPickupDate}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Jam (HH:MM) *"
            value={pickupTime}
            onChangeText={setPickupTime}
          />
        </View>
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pesanan</Text>
        {products.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada produk. Tambah produk dulu.</Text>
        ) : (
          <View style={styles.productGrid}>
            {products.map((p) => {
              const inCart = cart.find((c) => c.product.id === p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => addToCart(p)}
                  style={[styles.prodBtn, inCart && styles.prodBtnActive]}
                >
                  <Text style={[styles.prodName, inCart && styles.prodNameActive]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.prodPrice, inCart && styles.prodPriceActive]}>
                    Rp {p.price.toLocaleString("id-ID")}
                  </Text>
                  {inCart ? (
                    <Text style={styles.prodQty}>{inCart.quantity}x</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {cart.length > 0 && (
          <View style={styles.cartSummary}>
            {cart.map((c) => (
              <View key={c.product.id} style={styles.cartItem}>
                <Text style={styles.cartItemName} numberOfLines={1}>
                  {c.product.name}
                </Text>
                <View style={styles.cartQty}>
                  <Pressable onPress={() => updateQty(c.product.id, -1)} style={styles.qtyBtn}>
                    <Icon name="minus" size={16} color="#1565C0" />
                  </Pressable>
                  <Text style={styles.qtyText}>{c.quantity}</Text>
                  <Pressable onPress={() => updateQty(c.product.id, 1)} style={styles.qtyBtn}>
                    <Icon name="plus" size={16} color="#1565C0" />
                  </Pressable>
                </View>
              </View>
            ))}
            <Text style={styles.cartTotal}>
              Total: Rp {total.toLocaleString("id-ID")}
            </Text>
          </View>
        )}
      </View>

      {/* Payment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pembayaran</Text>
        <TextInput
          style={styles.input}
          placeholder="Nominal DP (0 = lunas nanti)"
          keyboardType="number-pad"
          value={dpAmount}
          onChangeText={setDpAmount}
        />
        {dp > 0 && (
          <Text style={styles.paymentStatus}>
            Status: <Text style={{ fontWeight: "700" }}>{paymentStatus}</Text> — Rp {dp.toLocaleString("id-ID")}
            {paymentStatus === "DP" && total > 0
              ? ` (sisa Rp ${(total - dp).toLocaleString("id-ID")})`
              : ""}
          </Text>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catatan</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Catatan khusus (pisah cuka, vacuum, dll)"
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Save */}
      <Pressable onPress={save} style={styles.saveBtn}>
        <Icon name="content-save" size={20} color="#fff" />
        <Text style={styles.saveText}>Simpan Pre-Order</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#212121" },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#212121", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  dateRow: { flexDirection: "row", gap: 10 },

  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prodBtn: {
    width: "30%",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  prodBtnActive: { backgroundColor: "#E3F2FD", borderColor: "#1565C0" },
  prodName: { fontSize: 13, fontWeight: "600", color: "#212121" },
  prodNameActive: { color: "#1565C0" },
  prodPrice: { fontSize: 11, color: "#757575", marginTop: 2 },
  prodPriceActive: { color: "#1565C0", fontWeight: "700" },
  prodQty: { fontSize: 11, color: "#1565C0", fontWeight: "700", marginTop: 2 },

  cartSummary: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 10 },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  cartItemName: { fontSize: 14, flex: 1, color: "#212121" },
  cartQty: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: { fontSize: 14, fontWeight: "700", minWidth: 20, textAlign: "center", color: "#212121" },
  cartTotal: { fontSize: 15, fontWeight: "700", color: "#1565C0", textAlign: "right", marginTop: 8 },

  paymentStatus: { fontSize: 14, color: "#1565C0" },
  emptyText: { color: "#9E9E9E", fontSize: 14, textAlign: "center", padding: 20 },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1565C0",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  successBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  successTitle: { fontSize: 22, fontWeight: "700", color: "#212121", marginTop: 16 },
  successDetail: { fontSize: 15, color: "#757575", marginTop: 8, textAlign: "center" },
  newPoBtn: {
    marginTop: 32,
    backgroundColor: "#1565C0",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  newPoText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

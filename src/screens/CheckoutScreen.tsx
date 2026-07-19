import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import { getProducts, processCheckout, type Product } from "../db/service";
import { Colors, Spacing, FontSize, BorderRadius, Shadow, Typography } from "../theme";

interface CartItem {
  product: Product;
  quantity: number;
}

const PAYMENT_METHODS = [
  { key: "tunai" as const, icon: "cash", label: "Tunai" },
  { key: "qris" as const, icon: "qr-code", label: "QRIS" },
  { key: "transfer" as const, icon: "bank-transfer", label: "Transfer" },
];

export default function CheckoutScreen() {
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<"tunai" | "qris" | "transfer">("tunai");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);

  const refresh = useCallback(() => setProducts(getProducts()), []);

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

  const removeItem = (productId: number) => setCart((prev) => prev.filter((c) => c.product.id !== productId));

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

  const checkout = () => {
    if (cart.length === 0) return;
    const result = processCheckout(
      cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      payment
    );
    setLastTotal(result.transaction.total);
    setShowReceipt(true);
    setCart([]);
    refresh();
  };

  const clearCart = () => setCart([]);

  if (showReceipt) {
    return (
      <View style={styles.screen}>
        <View style={styles.receiptBox}>
          <View style={styles.receiptIcon}>
            <Icon name="check-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.receiptTitle}>Transaksi Berhasil</Text>
          <Text style={styles.receiptTotal}>Rp {lastTotal.toLocaleString("id-ID")}</Text>
          <View style={styles.receiptBadge}>
            <Icon name={PAYMENT_METHODS.find((m) => m.key === payment)?.icon ?? "cash"} size={16} color={Colors.white} />
            <Text style={styles.receiptPayment}>{PAYMENT_METHODS.find((m) => m.key === payment)?.label}</Text>
          </View>
          <Pressable onPress={() => setShowReceipt(false)} style={styles.newTxBtn}>
            <Text style={styles.newTxText}>Transaksi Baru</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={products}
        keyExtractor={(p) => String(p.id)}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Pilih Produk</Text>}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="package-variant" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada produk.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => addToCart(item)} style={({ pressed }) => [styles.productBtn, pressed && styles.productBtnPressed]}>
            <View style={styles.productIcon}>
              <Icon name={item.type === "paket" ? "package-variant" : "food"} size={28} color={Colors.primary} />
            </View>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>Rp {item.price.toLocaleString("id-ID")}</Text>
            {item.deductsVinegar && (
              <View style={styles.vinegarBadge}>
                <Icon name="bottle-tonic-plus" size={10} color={Colors.primary} />
                <Text style={styles.vinegarBadgeText}>{item.stock}</Text>
              </View>
            )}
          </Pressable>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.cartPanel}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Keranjang ({cart.length})</Text>
            <Pressable onPress={clearCart}><Text style={styles.clearText}>Hapus semua</Text></Pressable>
          </View>

          <FlatList
            data={cart}
            keyExtractor={(c) => String(c.product.id)}
            style={{ maxHeight: 160 }}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <Pressable onPress={() => updateQty(item.product.id, -1)} style={styles.qtyBtn}>
                    <Icon name="minus" size={16} color={Colors.primary} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable onPress={() => updateQty(item.product.id, 1)} style={styles.qtyBtn}>
                    <Icon name="plus" size={16} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => removeItem(item.product.id)} style={styles.removeBtn}>
                    <Icon name="delete-outline" size={18} color={Colors.danger} />
                  </Pressable>
                </View>
              </View>
            )}
          />

          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map((m) => (
              <Pressable key={m.key} onPress={() => setPayment(m.key)} style={[styles.paymentBtn, payment === m.key && styles.paymentBtnActive]}>
                <Icon name={m.icon} size={18} color={payment === m.key ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.paymentText, payment === m.key && styles.paymentTextActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>Rp {total.toLocaleString("id-ID")}</Text>
            </View>
            <Pressable onPress={checkout} style={styles.checkoutBtn}>
              <Text style={styles.checkoutText}>Bayar</Text>
              <Icon name="arrow-right" size={20} color={Colors.white} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  sectionTitle: { ...Typography.h3, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  grid: { paddingHorizontal: 12, paddingBottom: 12 },
  gridRow: { gap: 8 },
  productBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 12, alignItems: "center", marginBottom: 8, ...Shadow.card },
  productBtnPressed: { backgroundColor: Colors.primaryLight, opacity: 0.8 },
  productIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  productName: { fontSize: FontSize.sm, fontWeight: "600", textAlign: "center", color: Colors.text, lineHeight: 16 },
  productPrice: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.primary, marginTop: 4 },
  vinegarBadge: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4, backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  vinegarBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: "600" },
  emptyBox: { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyText: { ...Typography.muted, fontSize: FontSize.md },
  cartPanel: { backgroundColor: Colors.card, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.lg, ...Shadow.modal },
  cartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cartTitle: { ...Typography.h3 },
  clearText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: "600" },
  cartItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  cartItemName: { fontSize: FontSize.md, fontWeight: "500", color: Colors.text },
  cartItemPrice: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.primary, marginTop: 1 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: BorderRadius.sm, backgroundColor: Colors.primaryLight, justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: FontSize.md, fontWeight: "700", minWidth: 24, textAlign: "center", color: Colors.text },
  removeBtn: { padding: 4 },
  paymentRow: { flexDirection: "row", gap: 8, marginVertical: 12 },
  paymentBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  paymentBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  paymentText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  paymentTextActive: { color: Colors.white },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  totalAmount: { fontSize: 22, fontWeight: "800", color: Colors.text },
  checkoutBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.success, paddingHorizontal: 28, paddingVertical: 14, borderRadius: BorderRadius.xl },
  checkoutText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: "700" },
  receiptBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  receiptIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.successLight, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  receiptTitle: { ...Typography.h2, marginTop: 4 },
  receiptTotal: { fontSize: 36, fontWeight: "800", color: Colors.success, marginTop: 8 },
  receiptBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  receiptPayment: { color: Colors.white, fontSize: FontSize.md, fontWeight: "600" },
  newTxBtn: { marginTop: 32, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.lg },
  newTxText: { color: Colors.white, fontSize: FontSize.md, fontWeight: "600" },
});

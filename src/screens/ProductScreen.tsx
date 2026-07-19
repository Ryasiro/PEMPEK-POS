import { useCallback, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import Icon from "../components/Icon";
import { createProduct, deleteProduct, getProducts, updateProduct, type Product } from "../db/service";
import { Colors, Spacing, FontSize, BorderRadius, Shadow, Typography } from "../theme";

const emptyForm = {
  name: "",
  type: "eceran" as "eceran" | "paket",
  price: "",
  description: "",
  deductsVinegar: false,
  stock: "",
};

export default function ProductScreen() {
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<"all" | "eceran" | "paket">("all");

  const refresh = useCallback(() => setProducts(getProducts()), []);

  const filtered = filter === "all" ? products : products.filter((p) => p.type === filter);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      type: p.type as "eceran" | "paket",
      price: String(p.price),
      description: p.description ?? "",
      deductsVinegar: p.deductsVinegar,
      stock: String(p.stock),
    });
    setModal(true);
  };

  const save = () => {
    const price = parseInt(form.price, 10) || 0;
    const stock = parseInt(form.stock, 10) || 0;
    if (!form.name.trim()) return;
    if (price <= 0) return;

    const data = {
      name: form.name.trim(),
      type: form.type,
      price,
      description: form.description.trim(),
      deductsVinegar: form.deductsVinegar,
      stock,
    };

    if (editing) updateProduct(editing, data);
    else createProduct(data);

    setModal(false);
    refresh();
  };

  const remove = (id: number) => {
    deleteProduct(id);
    refresh();
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.typeIcon, { backgroundColor: item.type === "eceran" ? Colors.primaryLight : Colors.secondaryLight }]}>
          <Icon name={item.type === "eceran" ? "food" : "package-variant"} size={22} color={item.type === "eceran" ? Colors.primary : Colors.secondary} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: item.type === "eceran" ? Colors.primaryLight : Colors.secondaryLight }]}>
            <Text style={[styles.badgeText, { color: item.type === "eceran" ? Colors.primary : Colors.secondary }]}>
              {item.type === "eceran" ? "Eceran" : "Paket"}
            </Text>
          </View>
        </View>
        <Text style={styles.cardPrice}>Rp {item.price.toLocaleString("id-ID")}</Text>
        {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
        {item.deductsVinegar && (
          <View style={styles.vinegarRow}>
            <Icon name="bottle-tonic-plus" size={14} color={Colors.primary} />
            <Text style={styles.vinegarText}>Cuka: {item.stock} botol</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => openEdit(item)} style={styles.iconBtn}>
          <Icon name="pencil-outline" size={18} color={Colors.textSecondary} />
        </Pressable>
        <Pressable onPress={() => remove(item.id)} style={styles.iconBtn}>
          <Icon name="trash-can-outline" size={18} color={Colors.danger} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(["all", "eceran", "paket"] as const).map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "Semua" : f === "eceran" ? "Eceran" : "Paket"}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={openAdd} style={styles.addBtn}>
          <Icon name="plus" size={18} color={Colors.white} />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : { paddingBottom: 24, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="package-variant" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada produk</Text>
          </View>
        }
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? "Edit Produk" : "Produk Baru"}</Text>

            <TextInput style={styles.input} placeholder="Nama produk" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

            <View style={styles.typeRow}>
              <Pressable onPress={() => setForm({ ...form, type: "eceran" })} style={[styles.typeBtn, form.type === "eceran" && styles.typeBtnActive]}>
                <Text style={[styles.typeText, form.type === "eceran" && styles.typeTextActive]}>Eceran</Text>
              </Pressable>
              <Pressable onPress={() => setForm({ ...form, type: "paket" })} style={[styles.typeBtn, form.type === "paket" && styles.typeBtnActive]}>
                <Text style={[styles.typeText, form.type === "paket" && styles.typeTextActive]}>Paket</Text>
              </Pressable>
            </View>

            <TextInput style={styles.input} placeholder="Harga (Rp)" keyboardType="number-pad" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Deskripsi (opsional)" multiline value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Lacak stok cuka</Text>
                <Text style={styles.switchHint}>Potong stok saat checkout</Text>
              </View>
              <Switch value={form.deductsVinegar} onValueChange={(v) => setForm({ ...form, deductsVinegar: v })} />
            </View>

            {form.deductsVinegar && (
              <TextInput style={styles.input} placeholder="Jumlah stok (botol)" keyboardType="number-pad" value={form.stock} onChangeText={(v) => setForm({ ...form, stock: v })} />
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={() => setModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Batal</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveText}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.bg,
  },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "600" },
  filterTextActive: { color: Colors.white },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadow.card,
  },
  cardLeft: { marginRight: 12 },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  cardName: { ...Typography.h3, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: FontSize.xs, fontWeight: "600" },
  cardPrice: { ...Typography.price, fontSize: FontSize.md, marginTop: 2 },
  cardDesc: { ...Typography.muted, fontSize: FontSize.sm, marginTop: 2, lineHeight: 16 },
  vinegarRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  vinegarText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: "500" },
  actions: { justifyContent: "center", gap: 4, paddingLeft: 8 },
  iconBtn: { padding: 6 },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", gap: 12 },
  emptyText: { ...Typography.muted, fontSize: FontSize.md },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end" },
  modal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    maxHeight: "85%",
  },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.md,
    marginBottom: 12,
    backgroundColor: Colors.bg,
    color: Colors.text,
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: "600" },
  typeTextActive: { color: Colors.white },
  switchRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingVertical: 8 },
  switchLabel: { ...Typography.body, fontWeight: "600" },
  switchHint: { ...Typography.muted, marginTop: 1 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelText: { ...Typography.body, color: Colors.textSecondary, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveText: { ...Typography.body, color: Colors.white, fontWeight: "600" },
});

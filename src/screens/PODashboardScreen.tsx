import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "../components/Icon";
import { getPreOrders, processCheckout, updatePreOrderStatus, type PreOrder } from "../db/service";
import { Colors, Spacing, FontSize, BorderRadius, Shadow, Typography } from "../theme";

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; next: string | null }> = {
  menunggu: { label: "Menunggu", icon: "clock-outline", color: Colors.warning, next: "diproses" },
  diproses: { label: "Diproses", icon: "progress-check", color: "#2196F3", next: "siap" },
  siap: { label: "Siap", icon: "check-circle-outline", color: Colors.success, next: "diambil" },
  diambil: { label: "Diambil", icon: "check-circle", color: Colors.primary, next: null },
  dibatalkan: { label: "Dibatalkan", icon: "close-circle", color: Colors.danger, next: null },
};

const SORT_SCORE: Record<string, number> = {
  menunggu: 0,
  diproses: 1,
  siap: 2,
  diambil: 3,
  dibatalkan: 4,
};

export default function PODashboardScreen() {
  const [orders, setOrders] = useState<PreOrder[]>(() =>
    [...getPreOrders()].sort((a, b) => {
      const sa = SORT_SCORE[a.status] ?? 99;
      const sb = SORT_SCORE[b.status] ?? 99;
      if (sa !== sb) return sa - sb;
      return (a.pickupDate?.getTime() ?? 0) - (b.pickupDate?.getTime() ?? 0);
    })
  );
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PreOrder | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const refresh = useCallback(() => {
    setOrders(
      [...getPreOrders()].sort((a, b) => {
        const sa = SORT_SCORE[a.status] ?? 99;
        const sb = SORT_SCORE[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        return (a.pickupDate?.getTime() ?? 0) - (b.pickupDate?.getTime() ?? 0);
      })
    );
  }, []);

  const advanceStatus = (po: PreOrder) => {
    const info = STATUS_CONFIG[po.status];
    if (!info?.next) return;

    if (info.next === "diambil") {
      setSelectedPo(po);
      setPayAmount("");
      setShowPayModal(true);
      return;
    }

    updatePreOrderStatus(po.id, info.next as any);
    refresh();
  };

  const confirmPickup = () => {
    if (!selectedPo) return;
    const remaining = parseInt(payAmount, 10) || 0;

    if (remaining > 0) {
      processCheckout([{ productId: 0, quantity: 1 }], "tunai", `Pelunasan PO #${selectedPo.id}`);
    }

    updatePreOrderStatus(selectedPo.id, "diambil");
    setShowPayModal(false);
    setSelectedPo(null);
    refresh();
  };

  const cancelPo = (po: PreOrder) => {
    Alert.alert("Batalkan PO", `Batalkan pesanan ${po.customerName}?`, [
      { text: "Tidak", style: "cancel" },
      { text: "Ya, batalkan", style: "destructive", onPress: () => { updatePreOrderStatus(po.id, "dibatalkan"); refresh(); } },
    ]);
  };

  const renderItem = ({ item }: { item: PreOrder }) => {
    const info = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.menunggu;
    const isActive = item.status !== "diambil" && item.status !== "dibatalkan";
    const isOverdue = isActive && item.pickupDate && item.pickupDate.getTime() < Date.now();

    return (
      <View style={[styles.card, isOverdue && styles.cardOverdue]}>
        <View style={styles.cardTop}>
          <View style={[styles.statusDot, { backgroundColor: info.color }]} />
          <View style={[styles.statusBadge, { backgroundColor: info.color + "18" }]}>
            <Icon name={info.icon} size={14} color={info.color} />
            <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
          </View>
          {isOverdue && <View style={styles.overdueBadge}><Text style={styles.overdueText}>Terlewat</Text></View>}
          {isActive && item.status !== "menunggu" && (
            <Pressable onPress={() => cancelPo(item)} style={{ marginLeft: "auto" }}>
              <Icon name="close-circle" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        <Text style={styles.customerName}>{item.customerName}</Text>
        {item.customerContact ? <Text style={styles.contact}>{item.customerContact}</Text> : null}

        <View style={styles.infoRow}>
          <Icon name="calendar-clock" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            {item.pickupDate
              ? `${item.pickupDate.toLocaleDateString("id-ID", { weekday: "short", month: "short", day: "numeric" })} ${item.pickupDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
              : "—"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="wallet" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            {item.dpAmount > 0 ? `DP: Rp ${item.dpAmount.toLocaleString("id-ID")}` : "Belum DP"}
          </Text>
        </View>

        {item.notes ? (
          <View style={styles.notesBox}>
            <Icon name="note-text-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        ) : null}

        {isActive && (
          <View style={styles.actions}>
            <Pressable onPress={() => advanceStatus(item)} style={styles.advanceBtn}>
              <Text style={styles.advanceText}>
                {info.next === "diambil" ? "Serah Terima" : STATUS_CONFIG[info.next!]?.label ?? ""}
              </Text>
              <Icon name="arrow-right" size={18} color={Colors.white} />
            </Pressable>
            {item.status === "menunggu" && (
              <Pressable onPress={() => cancelPo(item)} style={styles.cancelBtn}>
                <Icon name="close" size={18} color={Colors.danger} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        renderItem={renderItem}
        refreshing={false}
        onRefresh={refresh}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Icon name="clipboard-text-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada pre-order</Text>
            <Text style={styles.emptySub}>Buat PO baru dari menu PO</Text>
          </View>
        }
      />

      {showPayModal && selectedPo && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Serah Terima</Text>
            <Text style={styles.modalSub}>{selectedPo.customerName}</Text>
            <Text style={styles.modalInfo}>DP: Rp {selectedPo.dpAmount.toLocaleString("id-ID")}</Text>
            <TextInput
              style={styles.input}
              placeholder="Sisa pembayaran (Rp)"
              keyboardType="number-pad"
              value={payAmount}
              onChangeText={setPayAmount}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowPayModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </Pressable>
              <Pressable onPress={confirmPickup} style={styles.modalConfirmBtn}>
                <Icon name="check" size={18} color={Colors.white} />
                <Text style={styles.modalConfirmText}>Selesaikan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadow.card,
  },
  cardOverdue: { borderLeftWidth: 3, borderLeftColor: Colors.danger },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: FontSize.sm, fontWeight: "700" },
  overdueBadge: { backgroundColor: Colors.dangerLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  overdueText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.danger },

  customerName: { ...Typography.h2, fontSize: FontSize.lg, marginBottom: 1 },
  contact: { ...Typography.muted, marginBottom: 6 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  notesBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: Colors.bg,
    padding: 10,
    borderRadius: BorderRadius.md,
    marginTop: 10,
  },
  notesText: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },

  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  advanceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  advanceText: { color: Colors.white, fontSize: FontSize.md, fontWeight: "600" },
  cancelBtn: {
    width: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
  },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", gap: 8 },
  emptyText: { ...Typography.muted, fontSize: FontSize.md },
  emptySub: { ...Typography.muted, fontSize: FontSize.sm },

  overlay: { position: "absolute", inset: 0, backgroundColor: Colors.overlay, justifyContent: "flex-end" },
  modal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
  },
  modalTitle: { ...Typography.h2 },
  modalSub: { ...Typography.caption, marginTop: 4 },
  modalInfo: { fontSize: FontSize.md, color: Colors.primary, fontWeight: "600", marginTop: 8, marginBottom: 12 },
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
  modalActions: { flexDirection: "row", gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  modalCancelText: { ...Typography.body, color: Colors.textSecondary, fontWeight: "600" },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
  },
  modalConfirmText: { ...Typography.body, color: Colors.white, fontWeight: "600" },
});

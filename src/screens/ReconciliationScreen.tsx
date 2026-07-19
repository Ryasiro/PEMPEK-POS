import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "../components/Icon";
import { getRevenueSummary, type Transaction } from "../db/service";
import { Colors, Spacing, FontSize, BorderRadius, Shadow, Typography } from "../theme";

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const METHOD_CFG: Record<string, { label: string; icon: string }> = {
  tunai: { label: "Tunai", icon: "cash" },
  qris: { label: "QRIS", icon: "qr-code" },
  transfer: { label: "Transfer", icon: "bank-transfer" },
};

export default function ReconciliationScreen() {
  const [fromDate, setFromDate] = useState(todayString());
  const [toDate, setToDate] = useState(todayString());
  const [summary, setSummary] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const e = new Date(d); e.setHours(23, 59, 59, 999);
    return getRevenueSummary(d, e);
  });

  const refresh = useCallback(() => {
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T23:59:59`);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return;
    setSummary(getRevenueSummary(from, to));
  }, [fromDate, toDate]);

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const cfg = METHOD_CFG[item.paymentMethod] ?? { label: item.paymentMethod, icon: "cash" };
    return (
      <View style={styles.txRow}>
        <View style={styles.txLeft}>
          <Text style={styles.txId}>#{item.id}</Text>
          <Text style={styles.txTime}>
            {item.createdAt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        <View style={styles.txCenter}>
          <View style={styles.txMethodBadge}>
            <Icon name={cfg.icon} size={12} color={Colors.textSecondary} />
            <Text style={styles.txMethod}>{cfg.label}</Text>
          </View>
          {item.note ? <Text style={styles.txNote} numberOfLines={1}>{item.note}</Text> : null}
        </View>
        <Text style={styles.txTotal}>Rp {item.total.toLocaleString("id-ID")}</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Date filter */}
      <View style={styles.filterRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Dari</Text>
          <TextInput style={styles.dateField} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
        </View>
        <Icon name="arrow-right" size={16} color={Colors.textMuted} style={{ marginTop: 22 }} />
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Sampai</Text>
          <TextInput style={styles.dateField} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
        </View>
        <Pressable onPress={refresh} style={styles.filterBtn}>
          <Icon name="magnify" size={20} color={Colors.white} />
        </Pressable>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.card, { backgroundColor: Colors.primaryLight }]}>
          <Icon name="receipt" size={22} color={Colors.primary} />
          <Text style={styles.cardValue}>{summary.count}</Text>
          <Text style={styles.cardLabel}>Transaksi</Text>
        </View>
        <View style={[styles.card, { backgroundColor: Colors.successLight }]}>
          <Icon name="cash-multiple" size={22} color={Colors.success} />
          <Text style={styles.cardValue}>Rp {summary.gross.toLocaleString("id-ID")}</Text>
          <Text style={styles.cardLabel}>Pendapatan</Text>
        </View>
        <View style={[styles.card, { backgroundColor: Colors.secondaryLight }]}>
          <Icon name="food" size={22} color={Colors.secondary} />
          <Text style={styles.cardValue}>{summary.itemsSold}</Text>
          <Text style={styles.cardLabel}>Terjual</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#F3E5F5" }]}>
          <Icon name="clipboard-text" size={22} color="#7B1FA2" />
          <Text style={styles.cardValue}>{summary.activePOs}</Text>
          <Text style={styles.cardLabel}>PO Aktif</Text>
        </View>
      </View>

      {/* Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
        {(["tunai", "qris", "transfer"] as const).map((method) => {
          const data = summary.byMethod[method];
          if (!data) return null;
          const cfg = METHOD_CFG[method];
          return (
            <View key={method} style={styles.brRow}>
              <View style={styles.brLeft}>
                <Icon name={cfg.icon} size={18} color={Colors.textSecondary} />
                <Text style={styles.brMethod}>{cfg.label}</Text>
                <Text style={styles.brCount}>{data.count} tx</Text>
              </View>
              <Text style={styles.brTotal}>Rp {data.total.toLocaleString("id-ID")}</Text>
            </View>
          );
        })}
        {Object.keys(summary.byMethod).length === 0 && (
          <Text style={styles.emptyText}>Tidak ada transaksi</Text>
        )}
      </View>

      {/* Transactions */}
      <View style={[styles.section, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>Daftar Transaksi</Text>
        <FlatList
          data={summary.transactions}
          keyExtractor={(t) => String(t.id)}
          renderItem={renderTransaction}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada transaksi</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateBlock: { flex: 1 },
  dateLabel: { ...Typography.label, marginBottom: 4 },
  dateField: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: FontSize.sm,
    backgroundColor: Colors.bg,
    color: Colors.text,
  },
  filterBtn: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: BorderRadius.md,
    marginTop: 16,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    flexWrap: "wrap",
  },
  card: {
    width: "48%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: 4,
    marginBottom: 8,
  },
  cardValue: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.text },
  cardLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "500" },

  section: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadow.card,
  },
  sectionTitle: { ...Typography.h3, marginBottom: 12 },

  brRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  brLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  brMethod: { fontSize: FontSize.md, fontWeight: "600", color: Colors.text },
  brCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  brTotal: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  txLeft: { width: 60 },
  txId: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  txTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  txCenter: { flex: 1, paddingHorizontal: 8 },
  txMethodBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  txMethod: { fontSize: FontSize.xs, color: Colors.textSecondary },
  txNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  txTotal: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },

  emptyText: { ...Typography.muted, textAlign: "center", padding: 20 },
});

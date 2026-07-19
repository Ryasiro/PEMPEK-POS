import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import { exportBackup, importBackup } from "../services/backup";
import { Colors, Spacing, FontSize, BorderRadius, Shadow, Typography } from "../theme";

export default function BackupScreen() {
  const [loading, setLoading] = useState<string | null>(null);

  const doExport = async () => {
    setLoading("export");
    try {
      await exportBackup();
    } finally {
      setLoading(null);
    }
  };

  const doImport = () => {
    Alert.alert(
      "Perhatian",
      "Import akan menghapus semua data saat ini dan menggantinya dengan data dari file backup. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, restore",
          style: "destructive",
          onPress: async () => {
            setLoading("import");
            try {
              await importBackup();
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.grid}>
        <Pressable
          onPress={doExport}
          disabled={loading !== null}
          style={[styles.card, styles.cardExport, loading === "export" && styles.disabled]}
        >
          <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
            <Icon name="database-export" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Ekspor Database</Text>
          <Text style={styles.cardDesc}>
            Simpan data ke file JSON. Bagikan ke cloud atau file manager.
          </Text>
          <View style={[styles.actionBtn, { backgroundColor: Colors.primary }]}>
            <Icon name="download" size={18} color={Colors.white} />
            <Text style={styles.actionText}>
              {loading === "export" ? "Mengekspor..." : "Ekspor Backup"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={doImport}
          disabled={loading !== null}
          style={[styles.card, styles.cardImport, loading === "import" && styles.disabled]}
        >
          <View style={[styles.iconBox, { backgroundColor: Colors.warningLight }]}>
            <Icon name="database-import" size={32} color={Colors.secondary} />
          </View>
          <Text style={styles.cardTitle}>Import Database</Text>
          <Text style={styles.cardDesc}>
            Pulihkan data dari file backup JSON yang sudah disimpan sebelumnya.
          </Text>
          <View style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}>
            <Icon name="upload" size={18} color={Colors.white} />
            <Text style={styles.actionText}>
              {loading === "import" ? "Mengimport..." : "Pilih & Restore"}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <Icon name="information" size={18} color={Colors.primary} />
        <Text style={styles.infoText}>
          File backup disimpan dalam format JSON. Bisa disimpan ke cloud, dikirim via email, atau dipindahkan ke perangkat lain.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  grid: { gap: Spacing.lg },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    ...Shadow.card,
  },
  cardExport: {},
  cardImport: {},
  disabled: { opacity: 0.6 },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.h2, marginBottom: 4 },
  cardDesc: { ...Typography.caption, textAlign: "center", lineHeight: 18, marginBottom: Spacing.lg },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  actionText: { color: Colors.white, fontSize: FontSize.md, fontWeight: "600" },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  infoText: { fontSize: FontSize.sm, color: Colors.primary, flex: 1, lineHeight: 18 },
});

import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "./src/components/Icon";
import { runMigrations } from "./src/db/migrate";
import ProductScreen from "./src/screens/ProductScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import PODashboardScreen from "./src/screens/PODashboardScreen";
import ReconciliationScreen from "./src/screens/ReconciliationScreen";
import BackupScreen from "./src/screens/BackupScreen";
import { Colors, FontSize, Spacing } from "./src/theme";

type Screen = "checkout" | "preorder" | "reconciliation" | "products" | "backup";

const TABS: { key: Screen; icon: string; label: string }[] = [
  { key: "checkout", icon: "cart", label: "POS" },
  { key: "preorder", icon: "clipboard-text", label: "PO" },
  { key: "reconciliation", icon: "chart-box-outline", label: "Laporan" },
  { key: "products", icon: "package-variant", label: "Produk" },
  { key: "backup", icon: "database", label: "Backup" },
];

const SCREENS: Record<Screen, () => JSX.Element> = {
  checkout: CheckoutScreen,
  preorder: PODashboardScreen,
  reconciliation: ReconciliationScreen,
  products: ProductScreen,
  backup: BackupScreen,
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("checkout");

  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        setReady(true);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={{ color: Colors.danger, fontSize: FontSize.md, textAlign: "center" }}>
            Error: {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={{ fontSize: FontSize.md, color: Colors.textSecondary }}>
            Memulai database...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ActiveScreen = SCREENS[screen];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* App Bar */}
      <View style={styles.appBar}>
        <Icon name="fish" size={26} color={Colors.white} />
        <Text style={styles.appBarTitle}>PempekPOS</Text>
      </View>

      {/* Screen content */}
      <View style={styles.content}>
        <ActiveScreen />
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = screen === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setScreen(tab.key)}
              style={styles.tab}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={active ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[styles.tabLabel, active && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {active && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  appBarTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    position: "relative",
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  tabLabelActive: { color: Colors.primary },
  tabIndicator: {
    position: "absolute",
    top: 0,
    width: 24,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
});

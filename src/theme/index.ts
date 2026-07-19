import { Platform } from "react-native";

export const Colors = {
  primary: "#1565C0",
  primaryLight: "#E3F2FD",
  primaryDark: "#0D47A1",

  secondary: "#FF6F00",
  secondaryLight: "#FFF3E0",

  success: "#2E7D32",
  successLight: "#E8F5E9",
  danger: "#EF5350",
  dangerLight: "#FFEBEE",
  warning: "#FF9800",
  warningLight: "#FFF8E1",

  text: "#212121",
  textSecondary: "#546E7A",
  textMuted: "#9E9E9E",

  bg: "#F5F5F5",
  card: "#FFFFFF",
  border: "#E0E0E0",
  borderLight: "#F5F5F5",

  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.4)",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
} as const;

export const Shadow = {
  card: {
    shadowColor: Colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modal: {
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
} as const;

export const Font = {
  regular: { fontWeight: "400" as const },
  medium: { fontWeight: "500" as const },
  semibold: { fontWeight: "600" as const },
  bold: { fontWeight: "700" as const },
  extrabold: { fontWeight: "800" as const },
};

export const Typography = {
  h1: { fontSize: FontSize.xxl, fontWeight: "800" as const, color: Colors.text, letterSpacing: 0.3 },
  h2: { fontSize: FontSize.xl, fontWeight: "700" as const, color: Colors.text },
  h3: { fontSize: FontSize.lg, fontWeight: "700" as const, color: Colors.text },
  body: { fontSize: FontSize.md, fontWeight: "400" as const, color: Colors.text },
  caption: { fontSize: FontSize.sm, fontWeight: "400" as const, color: Colors.textSecondary },
  muted: { fontSize: FontSize.xs, fontWeight: "400" as const, color: Colors.textMuted },
  price: { fontSize: FontSize.lg, fontWeight: "800" as const, color: Colors.primary },
  label: { fontSize: FontSize.xs, fontWeight: "700" as const, color: Colors.textSecondary, textTransform: "uppercase" as const, letterSpacing: 0.5 },
};

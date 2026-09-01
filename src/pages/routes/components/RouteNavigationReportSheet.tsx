import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { getRouteReportTypes, type RouteReportType } from "../utils/route-report-types";

type RouteNavigationReportSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: RouteReportType) => void;
};

export function RouteNavigationReportSheet({
  onClose,
  onSelect,
  visible,
}: RouteNavigationReportSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const reportTypes = useMemo(() => getRouteReportTypes(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Reportar na rota</Text>
          <Text style={styles.subtitle}>
            Toque no que você viu para avisar os outros pilotos.
          </Text>

          <View style={styles.grid}>
            {reportTypes.map((item) => (
              <Pressable
                key={item.type}
                accessibilityRole="button"
                accessibilityLabel={`Reportar ${item.label}`}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={() => {
                  onSelect(item.type);
                  onClose();
                }}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                  <Ionicons color={colors.text.inverse} name={item.icon} size={24} />
                </View>
                <Text style={styles.itemLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => ({
  backdrop: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border.default,
    borderRadius: 999,
    height: 5,
    marginBottom: 16,
    width: 44,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginBottom: 8,
    width: 56,
  },
  item: {
    alignItems: "center",
    width: "30%",
  },
  itemLabel: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  itemPressed: {
    opacity: 0.7,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 20,
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "800",
  },
});

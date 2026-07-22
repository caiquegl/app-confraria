import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type ActiveRouteFABProps = {
  /** Extra offset above the safe-area / bottom nav. */
  bottomOffset?: number;
  onPress: () => void;
};

export function ActiveRouteFAB({ bottomOffset = 86, onPress }: ActiveRouteFABProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 0) + bottomOffset }]}
    >
      <Pressable
        accessibilityLabel="Voltar para rota ativa"
        accessibilityRole="button"
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        onPress={onPress}
      >
        <View style={styles.dotWrap}>
          <View style={styles.dotPing} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.label}>Rota ativa</Text>
        <Ionicons color={colors.brandDark} name="navigate" size={14} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.brandDark,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  dotPing: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brandDark,
    borderRadius: 999,
    opacity: 0.35,
    transform: [{ scale: 1.8 }],
  },
  dotWrap: {
    alignItems: "center",
    height: 10,
    justifyContent: "center",
    width: 10,
  },
  label: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  pill: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: colors.brandGreen,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  pillPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  wrap: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 40,
  },
});

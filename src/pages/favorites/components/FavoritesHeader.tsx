import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type FavoritesHeaderProps = {
  onBack: () => void;
  topInset: number;
};

export function FavoritesHeader({ onBack, topInset }: FavoritesHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 12 }]}>
      <Pressable accessibilityRole="button" style={styles.backButton} onPress={onBack}>
        <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
      </Pressable>
      <Text style={styles.headerTitle}>Favoritos</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  headerSpacer: {
    height: 48,
    width: 48,
  },
  headerTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "900",
  },
});

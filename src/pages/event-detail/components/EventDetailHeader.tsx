import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

type EventDetailHeaderProps = {
  onBack: () => void;
};

export function EventDetailHeader({ onBack }: EventDetailHeaderProps) {
  return (
    <View style={[styles.header]}>
      <Pressable accessibilityRole="button" style={styles.backButton} onPress={onBack}>
        <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
      </Pressable>
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
    backgroundColor: colors.brandGray,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
});

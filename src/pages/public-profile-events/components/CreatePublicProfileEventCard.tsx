import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type CreatePublicProfileEventCardProps = {
  onPress: () => void;
};

export function CreatePublicProfileEventCard({ onPress }: CreatePublicProfileEventCardProps) {
  return (
    <Pressable accessibilityRole="button" style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.brandPrimary} name="git-branch-outline" size={22} />
        </View>
        <Text style={styles.label}>Criar um Evento</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 24,
    borderWidth: 1,
    padding: 8,
  },
  content: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    paddingVertical: 18,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  label: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "700",
  },
});

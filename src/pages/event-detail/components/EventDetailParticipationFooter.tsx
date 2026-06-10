import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type EventDetailParticipationFooterProps = {
  isParticipant: boolean;
  onPress: () => void;
  remainingSpots: number | null;
};

export function EventDetailParticipationFooter({
  isParticipant,
  onPress,
  remainingSpots,
}: EventDetailParticipationFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>Gratuito</Text>
            <Text style={styles.priceSubtitle}>por pessoa</Text>
          </View>
          {remainingSpots !== null ? (
            <View style={styles.spotsBadge}>
              <Text style={styles.spotsText}>{remainingSpots} restantes</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          style={[styles.button, isParticipant && styles.buttonConfirmed]}
          onPress={onPress}
        >
          {isParticipant ? (
            <Ionicons color={colors.brandDark} name="checkmark-circle-outline" size={18} />
          ) : null}
          <Text style={styles.buttonText}>
            {isParticipant ? "Presença confirmada" : "Participar do Evento"}
          </Text>
        </Pressable>
        <Text style={styles.note}>
          {isParticipant
            ? "Sua presença foi confirmada para este evento"
            : "Cancelamento gratuito em até 48h antes do Evento"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    height: 50,
    justifyContent: "center",
  },
  buttonConfirmed: {
    backgroundColor: "#EEF3E2",
  },
  buttonText: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E5E7EB",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    elevation: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
    shadowColor: "#000000",
    shadowOffset: { height: -3, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  note: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  price: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "900",
  },
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceSubtitle: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },
  spotsBadge: {
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  spotsText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  wrap: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
});

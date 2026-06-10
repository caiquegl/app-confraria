import { Ionicons } from "@expo/vector-icons";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

const EVENT_SHARE_BASE_URL =
  process.env.EXPO_PUBLIC_EVENT_SHARE_BASE_URL ?? "https://confraria-web.vercel.app";

type EventOwnerActionsFooterProps = {
  eventId: string;
  onShareWithFollower: () => void;
  title: string;
};

export function EventOwnerActionsFooter({
  eventId,
  onShareWithFollower,
  title,
}: EventOwnerActionsFooterProps) {
  const insets = useSafeAreaInsets();
  const eventUrl = `${EVENT_SHARE_BASE_URL.replace(/\/$/, "")}/events/${eventId}`;

  const shareEvent = async () => {
    await Share.share({
      message: `Veja este evento no Confraria: ${title}\n${eventUrl}`,
      title,
      url: eventUrl,
    });
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            style={styles.primaryAction}
            onPress={onShareWithFollower}
          >
            <Ionicons color={colors.brandDark} name="people-outline" size={18} />
            <Text style={styles.primaryActionText}>Mande para um seguidor</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartilhar evento"
            style={styles.iconAction}
            onPress={() => void shareEvent()}
          >
            <Ionicons color={colors.brandDark} name="share-social-outline" size={20} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: 10,
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
  iconAction: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "900",
  },
  wrap: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
});

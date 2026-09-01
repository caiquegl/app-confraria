import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { QuickRide } from "@/pages/quick-rides/types/quick-ride.types";
import {
  formatQuickRideWhen,
  getQuickRideDestinationLabel,
  isQuickRideFull,
} from "@/pages/quick-rides/types/quick-ride.types";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type QuickRideCardProps = {
  dimmed?: boolean;
  ended?: boolean;
  onPress: (ride: QuickRide) => void;
  ride: QuickRide;
  roleBadge?: string;
};

export function QuickRideCard({ dimmed, ended, onPress, ride, roleBadge }: QuickRideCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const count = ride.participantCount;
  const full = isQuickRideFull(ride);
  const isEnded = ended ?? false;
  const avatarUri =
    ride.host.avatarUrl ?? `https://i.pravatar.cc/100?u=${ride.host.id}`;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        (dimmed || isEnded) && styles.cardDimmed,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(ride)}
    >
      <Image source={{ uri: avatarUri }} style={styles.avatar} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {ride.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {getQuickRideDestinationLabel(ride)} · {formatQuickRideWhen(ride.startsAt)}
        </Text>
        {ride.description ? (
          <Text numberOfLines={2} style={styles.description}>
            {ride.description}
          </Text>
        ) : null}
        <View style={styles.badgesRow}>
          {roleBadge ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleBadge}</Text>
            </View>
          ) : null}
          {isEnded ? (
            <View style={[styles.badge, styles.badgeEnded]}>
              <Text style={styles.badgeEndedText}>Encerrado</Text>
            </View>
          ) : (
            <View style={[styles.badge, full && styles.badgeFull]}>
              <Ionicons
                color={full ? "#6B7280" : colors.brandPrimary}
                name="people"
                size={11}
              />
              <Text style={[styles.badgeText, full && styles.badgeTextFull]}>
                {full ? "Lotado" : `${count} ${count === 1 ? "topou" : "toparam"}`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => ({
  avatar: {
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface.quickRideBadge,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeFull: {
    backgroundColor: colors.surface.subtle,
  },
  badgeEnded: {
    backgroundColor: colors.surface.subtle,
  },
  badgeEndedText: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "700",
  },
  badgeText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  badgeTextFull: {
    color: colors.text.secondary,
  },
  roleBadge: {
    backgroundColor: colors.surface.infoSubtle,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: colors.text.info,
    fontSize: 11,
    fontWeight: "700",
  },
  badgesRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  card: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardDimmed: {
    opacity: 0.65,
  },
  cardPressed: {
    opacity: 0.72,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    color: colors.text.comment,
    fontSize: 13,
    marginTop: 4,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "700",
  },
});

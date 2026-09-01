import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventOccupancyCardProps = {
  participantLimit: number | null;
  participantsCount: number;
};

export function EventOccupancyCard({
  participantLimit,
  participantsCount,
}: EventOccupancyCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const hasLimit = participantLimit !== null && participantLimit > 0;
  const occupancy = hasLimit
    ? Math.min(100, Math.round((participantsCount / participantLimit) * 100))
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <View style={styles.iconBox}>
          <Ionicons color={colors.brandPrimary} name="people-outline" size={18} />
        </View>
        <Text style={styles.label}>Inscritos</Text>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.count}>{participantsCount}</Text>
        {hasLimit ? (
          <Text style={styles.countSubtitle}>de {participantLimit} vagas</Text>
        ) : null}
      </View>

      {hasLimit ? (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${occupancy}%` }]} />
          </View>
          <Text style={styles.helperText}>{occupancy}% das vagas preenchidas</Text>
        </>
      ) : (
        <Text style={styles.helperText}>Evento sem limite de vagas</Text>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  card: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  count: {
    color: colors.brandDark,
    fontSize: 32,
    fontWeight: "900",
  },
  countRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  countSubtitle: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  helperText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "700",
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  progressFill: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: "100%",
  },
  progressTrack: {
    backgroundColor: colors.surface.subtle,
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
    width: "100%",
  },
});

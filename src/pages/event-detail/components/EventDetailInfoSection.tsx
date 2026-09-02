import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventDetailInfoSectionProps = {
  canOpenDirections?: boolean;
  dateLabel: string;
  destinationLabel?: string | null;
  durationLabel: string;
  onOpenDirections?: () => void;
  originLabel: string;
  participantsCount: number;
  participantLimit: number | null;
  timeLabel: string;
  weekdayLabel: string;
};

export function EventDetailInfoSection({
  canOpenDirections = false,
  dateLabel,
  destinationLabel,
  durationLabel,
  onOpenDirections,
  originLabel,
  participantsCount,
  participantLimit,
  timeLabel,
  weekdayLabel,
}: EventDetailInfoSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const participantsLabel =
    participantsCount === 1 ? "1 participante inscrito" : `${participantsCount} participantes inscritos`;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Informações do Evento</Text>
      <View style={styles.items}>
        <InfoItem
          icon="calendar-outline"
          iconColor={colors.brandPrimary}
          subtitle={weekdayLabel}
          title={dateLabel}
        />
        <InfoItem
          icon="time-outline"
          iconColor="#D97706"
          subtitle={durationLabel}
          title={timeLabel}
        />
        <InfoItem
          icon="location-outline"
          iconColor="#6B7280"
          subtitle={destinationLabel ? `Destino: ${destinationLabel}` : undefined}
          title={`Ponto de Encontro: ${originLabel}`}
        >
          {canOpenDirections && onOpenDirections ? (
            <Pressable
              accessibilityLabel="Como chegar"
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => [styles.directionsButton, pressed && styles.directionsButtonPressed]}
              onPress={onOpenDirections}
            >
              <Ionicons color={colors.brandPrimary} name="navigate-outline" size={16} />
              <Text style={styles.directionsLabel}>Como chegar</Text>
            </Pressable>
          ) : null}
        </InfoItem>
        <InfoItem
          icon="people-outline"
          iconColor={colors.brandPrimary}
          subtitle={participantLimit !== null ? `Máximo ${participantLimit} pessoas` : undefined}
          title={participantsLabel}
        />
      </View>
    </View>
  );
}

type InfoItemProps = {
  children?: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  subtitle?: string;
  title: string;
};

function InfoItem({ children, icon, iconColor, subtitle, title }: InfoItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons color={iconColor} name={icon} size={20} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoTitle}>{title}</Text>
        {subtitle ? <Text style={styles.infoSubtitle}>{subtitle}</Text> : null}
        {children}
      </View>
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
  directionsButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface.subtle,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  directionsButtonPressed: {
    opacity: 0.7,
  },
  directionsLabel: {
    color: colors.brandPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoSubtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  items: {
    gap: 16,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 16,
  },
});

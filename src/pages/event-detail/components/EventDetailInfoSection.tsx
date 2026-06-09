import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type EventDetailInfoSectionProps = {
  dateLabel: string;
  destinationLabel?: string | null;
  durationLabel: string;
  originLabel: string;
  participantLimit: number | null;
  timeLabel: string;
  weekdayLabel: string;
};

export function EventDetailInfoSection({
  dateLabel,
  destinationLabel,
  durationLabel,
  originLabel,
  participantLimit,
  timeLabel,
  weekdayLabel,
}: EventDetailInfoSectionProps) {
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
        />
        {participantLimit ? (
          <InfoItem
            icon="people-outline"
            iconColor={colors.brandPrimary}
            subtitle={`Máximo ${participantLimit} pessoas`}
            title="Participantes confirmados"
          />
        ) : null}
      </View>
    </View>
  );
}

type InfoItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  subtitle?: string;
  title: string;
};

function InfoItem({ icon, iconColor, subtitle, title }: InfoItemProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons color={iconColor} name={icon} size={20} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoTitle}>{title}</Text>
        {subtitle ? <Text style={styles.infoSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
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
    color: "#6B7280",
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

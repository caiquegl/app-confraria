import { StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

import type { EventAnalyticsParticipant } from "../types/event-analytics.types";

type EventParticipantsListProps = {
  participants: EventAnalyticsParticipant[];
  participantsCount: number;
};

export function EventParticipantsList({
  participants,
  participantsCount,
}: EventParticipantsListProps) {
  const hasParticipants = participants.length > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Quem confirmou presença</Text>
      <Text style={styles.subtitle}>
        {participantsCount === 1
          ? "1 pessoa vai ao seu evento"
          : `${participantsCount} pessoas vão ao seu evento`}
      </Text>

      {hasParticipants ? (
        <View style={styles.items}>
          {participants.map((participant) => (
            <View key={participant.id} style={styles.item}>
              <UserAvatar
                avatarUrl={participant.avatarUrl}
                name={participant.name}
                size={42}
                style={styles.avatar}
              />
              <View style={styles.itemTextWrap}>
                <Text numberOfLines={1} style={styles.name}>
                  {participant.name}
                </Text>
                <Text style={styles.joinedAt}>{formatJoinedAt(participant.joinedAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {participantsCount > 0
              ? "A lista nominal de inscritos ainda não está disponível pelo backend."
              : "Ninguém confirmou presença ainda. Compartilhe o evento para receber inscrições."}
          </Text>
        </View>
      )}
    </View>
  );
}

function formatJoinedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Inscrição confirmada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  emptyBox: {
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
  },
  item: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  items: {
    gap: 12,
    marginTop: 14,
  },
  itemTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  joinedAt: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  name: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
  },
});

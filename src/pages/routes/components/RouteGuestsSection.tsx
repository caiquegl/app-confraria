import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import type {
  RouteParticipantResponse,
  RoutePendingInviteResponse,
} from "../types/saved-route.types";

type RouteGuestsSectionProps = {
  onInvite: () => void;
  participants: RouteParticipantResponse[];
  pendingInvites: RoutePendingInviteResponse[];
};

function GuestAvatar({ label, uri }: { label: string; uri: string | null }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatarImage} />;
  }

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>{label.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function RouteGuestsSection({
  onInvite,
  participants,
  pendingInvites,
}: RouteGuestsSectionProps) {
  const hasGuests = participants.length > 0 || pendingInvites.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Convidados</Text>
        <Pressable accessibilityRole="button" style={styles.inviteChip} onPress={onInvite}>
          <Ionicons color={colors.brandDark} name="person-add-outline" size={14} />
          <Text style={styles.inviteChipText}>Convidar</Text>
        </Pressable>
      </View>

      {!hasGuests ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Convide amigos pelo chat para fazerem este passeio juntos no mesmo dia.
          </Text>
          <Button size="default" style={styles.inviteButton} onPress={onInvite}>
            Convidar pelo chat
          </Button>
        </View>
      ) : (
        <View style={styles.listCard}>
          {participants.map((participant) => (
            <View key={participant.id} style={styles.guestRow}>
              <GuestAvatar label={participant.name} uri={participant.avatarUrl} />
              <View style={styles.guestCopy}>
                <Text style={styles.guestName}>{participant.name}</Text>
                <Text style={styles.guestMeta}>Confirmado</Text>
              </View>
              <Ionicons color={colors.brandGreen} name="checkmark-circle" size={18} />
            </View>
          ))}

          {pendingInvites.map((invite) => (
            <View key={invite.userId} style={styles.guestRow}>
              <GuestAvatar label={invite.name} uri={invite.avatarUrl} />
              <View style={styles.guestCopy}>
                <Text style={styles.guestName}>{invite.name}</Text>
                <Text style={styles.guestMeta}>Convite enviado</Text>
              </View>
              <Ionicons color="#F59E0B" name="time-outline" size={18} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarFallbackText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  avatarImage: {
    borderRadius: 999,
    height: 40,
    width: 40,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  guestCopy: {
    flex: 1,
    minWidth: 0,
  },
  guestMeta: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  guestName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  guestRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inviteButton: {
    alignSelf: "flex-start",
  },
  inviteChip: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inviteChipText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800",
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
});

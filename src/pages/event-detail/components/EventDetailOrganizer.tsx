import { StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

type EventDetailOrganizerProps = {
  avatarUrl: string | null;
  name: string;
};

export function EventDetailOrganizer({ avatarUrl, name }: EventDetailOrganizerProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Organizador</Text>
      <View style={styles.row}>
        <UserAvatar avatarUrl={avatarUrl} name={name} size={64} style={styles.avatar} />
        <View style={styles.textWrap}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subtitle}>Organizador do evento</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  name: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
  },
});

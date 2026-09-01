import { StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventDetailOrganizerProps = {
  avatarUrl: string | null;
  name: string;
};

export function EventDetailOrganizer({ avatarUrl, name }: EventDetailOrganizerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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

const createStyles = (colors: AppColors) => ({
  avatar: {
    borderRadius: 18,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
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
    color: colors.text.secondary,
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

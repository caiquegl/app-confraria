import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { UserSearchResult } from "../types/search.types";

type SearchUserCardProps = {
  user: UserSearchResult;
  onPress: () => void;
};

export function SearchUserCard({ user, onPress }: SearchUserCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <UserAvatar avatarUrl={user.avatar} name={user.name} size={54} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {user.name}
        </Text>
        <Text numberOfLines={1} style={styles.handle}>
          {user.handle}
        </Text>
        {user.location ? (
          <View style={styles.locationRow}>
            <Ionicons color={colors.text.muted} name="location-outline" size={12} />
            <Text numberOfLines={1} style={styles.locationText}>
              {user.location}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons color={colors.border.default} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      alignItems: "center",
      backgroundColor: colors.surface.primary,
      borderColor: colors.border.subtle,
      borderRadius: 24,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
      padding: 12,
    },
    handle: {
      color: colors.text.muted,
      fontSize: 13,
      marginTop: 2,
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    locationRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      marginTop: 4,
    },
    locationText: {
      color: colors.text.muted,
      flex: 1,
      fontSize: 12,
    },
    name: {
      color: colors.text.emphasis,
      fontSize: 15,
      fontWeight: "600",
    },
  });

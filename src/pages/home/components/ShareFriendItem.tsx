import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { FeedShareFriend } from "../types/feed.types";

type ShareFriendItemProps = {
  friend: FeedShareFriend;
  isSent: boolean;
  onSend: (friendId: string) => void | Promise<void>;
};

export function ShareFriendItem({ friend, isSent, onSend }: ShareFriendItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <UserAvatar avatarUrl={friend.avatar} name={friend.firstName} size={44} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {friend.firstName}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {friend.location || "Confraria"}
        </Text>
      </View>

      <Pressable
        disabled={isSent}
        style={[styles.button, isSent ? styles.buttonSent : styles.buttonDefault]}
        onPress={() => onSend(friend.id)}
      >
        <Ionicons
          name={isSent ? "checkmark-circle-outline" : "send-outline"}
          size={16}
          color={colors.brandDark}
        />
        <Text style={styles.buttonText}>{isSent ? "Enviado" : "Enviar"}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  button: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonDefault: {
    backgroundColor: colors.brandGreen,
  },
  buttonSent: {
    backgroundColor: colors.surface.brandSubtle,
  },
  buttonText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  container: {
    alignItems: "center",
    borderColor: colors.border.brandLight,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  location: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  name: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
});

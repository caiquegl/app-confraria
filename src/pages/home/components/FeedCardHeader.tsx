import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { formatRelativeTime } from "../services/feed.service";
import type { FeedPost } from "../types/feed.types";
import { FeedActionText } from "./FeedActionText";

type FeedCardHeaderProps = {
  onOpenUserProfile: (userId: string) => void;
  post: FeedPost;
};

export function FeedCardHeader({ onOpenUserProfile, post }: FeedCardHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={`Abrir perfil de ${post.userName}`}
        accessibilityRole="button"
        style={styles.authorButton}
        onPress={() => onOpenUserProfile(post.userId)}
      >
        <UserAvatar avatarUrl={post.userAvatar} name={post.userName} size={40} />

        <View style={styles.body}>
          <Text style={styles.userName} numberOfLines={1}>
            {post.userName}
          </Text>
          <FeedActionText post={post} style={styles.actionText} />
        </View>
      </Pressable>

      <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  actionText: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  authorButton: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  time: {
    color: colors.text.muted,
    fontSize: 12,
  },
  userName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
});

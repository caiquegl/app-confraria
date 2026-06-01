import { StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

import { formatRelativeTime } from "../services/feed.service";
import type { FeedPost } from "../types/feed.types";
import { FeedActionText } from "./FeedActionText";

type FeedCardHeaderProps = {
  post: FeedPost;
};

export function FeedCardHeader({ post }: FeedCardHeaderProps) {
  return (
    <View style={styles.container}>
      <UserAvatar avatarUrl={post.userAvatar} name={post.userName} size={40} />

      <View style={styles.body}>
        <Text style={styles.userName} numberOfLines={1}>
          {post.userName}
        </Text>
        <FeedActionText post={post} style={styles.actionText} />
      </View>

      <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionText: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 17,
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
    color: "#9CA3AF",
    fontSize: 12,
  },
  userName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
});

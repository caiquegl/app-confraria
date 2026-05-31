import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type FeedActionsProps = {
  commentCount: number;
  commentsVisible: boolean;
  isLiked: boolean;
  likeCount: number;
  onOpenShare: () => void;
  onToggleComments: () => void;
  onToggleLike: () => void;
};

export function FeedActions({
  commentCount,
  commentsVisible,
  isLiked,
  likeCount,
  onOpenShare,
  onToggleComments,
  onToggleLike,
}: FeedActionsProps) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.action} hitSlop={8} onPress={onToggleLike}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={20}
          color={isLiked ? "#EF4444" : "#9CA3AF"}
        />
        <Text style={[styles.count, isLiked && styles.likedText]}>{likeCount}</Text>
      </Pressable>

      <Pressable style={styles.action} hitSlop={8} onPress={onToggleComments}>
        <Ionicons
          name="chatbubble-outline"
          size={19}
          color={commentsVisible ? colors.brandGreen : "#9CA3AF"}
        />
        <Text style={[styles.count, commentsVisible && styles.commentsText]}>{commentCount}</Text>
      </Pressable>

      <Pressable style={[styles.action, styles.share]} hitSlop={8} onPress={onOpenShare}>
        <Ionicons name="share-social-outline" size={20} color="#9CA3AF" />
        <Text style={styles.count}>Compartilhar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  commentsText: {
    color: colors.brandGreen,
    fontWeight: "700",
  },
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  count: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
  },
  likedText: {
    color: "#EF4444",
    fontWeight: "700",
  },
  share: {
    marginLeft: "auto",
  },
});

import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

import { useFeed } from "../business/useFeed";
import { FeedList } from "../components/FeedList";
import { SharePostSheet } from "../components/SharePostSheet";

export function HomeView() {
  const {
    addComment,
    closeShare,
    friends,
    isPostLiked,
    openShare,
    posts,
    sentFriendId,
    sharePost,
    shareToFriend,
    toggleLike,
  } = useFeed();

  return (
    <View style={styles.container}>
      <FeedList
        posts={posts}
        isPostLiked={isPostLiked}
        onAddComment={addComment}
        onOpenShare={openShare}
        onToggleLike={toggleLike}
      />

      <SharePostSheet
        post={sharePost}
        friends={friends}
        sentFriendId={sentFriendId}
        onClose={closeShare}
        onSendToFriend={shareToFriend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: colors.brandDark,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 2,
  },
  versionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  versionMeta: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  versionRow: {
    color: "#6B7280",
    fontSize: 14,
  },
  versionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  versionValue: {
    color: colors.brandDark,
    fontWeight: "600",
  },
});

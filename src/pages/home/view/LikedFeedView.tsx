import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { getCurrentUserId } from "@/lib/auth";
import { useNotificationBadge } from "@/pages/notifications";
import { colors } from "@/theme/colors";

import { useLikedFeed } from "../business/useLikedFeed";
import { FeedFloatingActions } from "../components/FeedFloatingActions";
import { FeedList } from "../components/FeedList";
import { SharePostSheet } from "../components/SharePostSheet";

export function LikedFeedView() {
  const {
    addComment,
    addReply,
    closeShare,
    commentsLoadingByPost,
    deleteComment,
    editComment,
    friends,
    handlePrefetch,
    isLoadingInitial,
    isLoadingMore,
    listRef,
    loadComments,
    loadMoreFeed,
    openShare,
    posts,
    sentFriendId,
    sharePost,
    shareToFriend,
    toggleLike,
    toggleCommentLike,
  } = useLikedFeed();
  const { hasUnread } = useNotificationBadge();
  const openUserProfile = (userId: string) => {
    void getCurrentUserId().then((currentUserId) => {
      if (currentUserId === userId) {
        router.push("/profile");
        return;
      }

      router.push({ pathname: "/users/[userId]", params: { userId } });
    });
  };

  return (
    <View style={styles.container}>
      <FeedList
        posts={posts}
        listRef={listRef}
        commentsLoadingByPost={commentsLoadingByPost}
        emptyText="Curta publicações no feed para vê-las aqui."
        emptyTitle="Nenhum post curtido"
        isLoadingInitial={isLoadingInitial}
        isLoadingMore={isLoadingMore}
        onAddComment={addComment}
        onAddReply={addReply}
        onDeleteComment={deleteComment}
        onEditComment={editComment}
        onLoadComments={loadComments}
        onLoadMore={loadMoreFeed}
        onOpenShare={openShare}
        onOpenUserProfile={openUserProfile}
        onPrefetch={handlePrefetch}
        onToggleCommentLike={toggleCommentLike}
        onToggleLike={toggleLike}
      />

      <SharePostSheet
        post={sharePost}
        friends={friends}
        sentFriendId={sentFriendId}
        onClose={closeShare}
        onSendToFriend={shareToFriend}
      />

      <FeedFloatingActions
        hasUnreadNotifications={hasUnread}
        isLikedTabActive
        onOpenLiked={() => router.replace("/feed")}
        onOpenNewPost={() => router.replace("/feed")}
        onOpenNotifications={() => router.push("/notifications")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});

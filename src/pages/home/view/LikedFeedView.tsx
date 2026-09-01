import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { getCurrentUserId } from "@/lib/auth";
import { useChatBadge } from "@/pages/messages";
import { useNotificationBadge } from "@/pages/notifications";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { useLikedFeed } from "../business/useLikedFeed";
import { FeedFloatingActions } from "../components/FeedFloatingActions";
import { FeedList } from "../components/FeedList";
import { SharePostSheet } from "../components/SharePostSheet";

export function LikedFeedView() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
    isRefreshing,
    isRetrying,
    listRef,
    loadComments,
    loadError,
    loadMoreFeed,
    openShare,
    posts,
    refreshFeed,
    retryFeed,
    sentFriendId,
    sharePost,
    shareToFriend,
    toggleLike,
    toggleCommentLike,
  } = useLikedFeed();
  const { hasUnread: hasUnreadMessages } = useChatBadge();
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
        isRefreshing={isRefreshing}
        isRetrying={isRetrying}
        loadError={loadError}
        onAddComment={addComment}
        onAddReply={addReply}
        onDeleteComment={deleteComment}
        onEditComment={editComment}
        onLoadComments={loadComments}
        onLoadMore={loadMoreFeed}
        onOpenShare={openShare}
        onOpenUserProfile={openUserProfile}
        onPrefetch={handlePrefetch}
        onRefresh={() => void refreshFeed()}
        onRetry={() => void retryFeed()}
        onToggleCommentLike={toggleCommentLike}
        onToggleLike={toggleLike}
      />

      <SharePostSheet
        post={sharePost}
        friends={friends}
        sentFriendId={sentFriendId}
        onClose={closeShare}
        onSent={(result) => {
          closeShare();
          router.push({
            pathname: "/messages/[conversationId]",
            params: {
              conversationId: result.conversationId,
              participantAvatar: result.participantAvatar ?? "",
              participantName: result.participantName,
            },
          });
        }}
        onSendToFriend={shareToFriend}
      />

      <FeedFloatingActions
        hasUnreadMessages={hasUnreadMessages}
        hasUnreadNotifications={hasUnread}
        isLikedTabActive
        onOpenLiked={() => router.replace("/feed")}
        onOpenMessages={() => router.push("/messages")}
        onOpenNewPost={() => router.replace("/feed")}
        onOpenNotifications={() => router.push("/notifications")}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  container: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});

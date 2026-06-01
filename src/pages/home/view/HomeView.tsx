import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { useNotificationBadge } from "@/pages/notifications";
import { colors } from "@/theme/colors";

import { useFeed } from "../business/useFeed";
import { FeedFloatingActions } from "../components/FeedFloatingActions";
import { FeedList } from "../components/FeedList";
import { NewPostCamera } from "../components/NewPostCamera";
import { NewPostComposer } from "../components/NewPostComposer";
import { PostSuccessModal } from "../components/PostSuccessModal";
import { SharePostSheet } from "../components/SharePostSheet";

export function HomeView() {
  const {
    addComment,
    addCameraPhoto,
    cameraPhotos,
    commentsLoadingByPost,
    closeComposer,
    closeNewPostCamera,
    closePostSuccess,
    closeShare,
    composeActivePhotoIndex,
    composeAudience,
    composeCaption,
    composerPhotos,
    friends,
    handlePrefetch,
    isCameraOpen,
    isComposerOpen,
    isLoadingInitial,
    isLoadingMore,
    isPostSuccessVisible,
    isPublishingPost,
    listRef,
    loadComments,
    loadMoreFeed,
    openComposerFromCamera,
    openComposerFromGallery,
    openNewPostCamera,
    openShare,
    publishPost,
    posts,
    removeComposerPhoto,
    reorderComposerPhotos,
    sentFriendId,
    setComposeActivePhotoIndex,
    setComposeAudience,
    setComposeCaption,
    sharePost,
    shareToFriend,
    toggleLike,
  } = useFeed();
  const { hasUnread } = useNotificationBadge();

  return (
    <View style={styles.container}>
      <FeedList
        posts={posts}
        listRef={listRef}
        commentsLoadingByPost={commentsLoadingByPost}
        isLoadingInitial={isLoadingInitial}
        isLoadingMore={isLoadingMore}
        onAddComment={addComment}
        onLoadComments={loadComments}
        onLoadMore={loadMoreFeed}
        onOpenShare={openShare}
        onPrefetch={handlePrefetch}
        onToggleLike={toggleLike}
      />

      <SharePostSheet
        post={sharePost}
        friends={friends}
        sentFriendId={sentFriendId}
        onClose={closeShare}
        onSendToFriend={shareToFriend}
      />

      <NewPostCamera
        capturedPhotos={cameraPhotos}
        visible={isCameraOpen}
        onAddPhoto={addCameraPhoto}
        onClose={closeNewPostCamera}
        onDone={openComposerFromCamera}
        onGallerySelected={openComposerFromGallery}
      />

      <NewPostComposer
        activePhotoIndex={composeActivePhotoIndex}
        audience={composeAudience}
        caption={composeCaption}
        photos={composerPhotos}
        publishing={isPublishingPost}
        visible={isComposerOpen}
        onBack={closeComposer}
        onChangeActivePhotoIndex={setComposeActivePhotoIndex}
        onChangeAudience={setComposeAudience}
        onChangeCaption={setComposeCaption}
        onRemovePhoto={removeComposerPhoto}
        onReorderPhotos={reorderComposerPhotos}
        onPublish={publishPost}
      />

      <PostSuccessModal visible={isPostSuccessVisible} onContinue={closePostSuccess} />

      {!isComposerOpen && !isCameraOpen && (
        <FeedFloatingActions
          hasUnreadNotifications={hasUnread}
          onOpenLiked={() => router.push("/feed/liked")}
          onOpenNewPost={openNewPostCamera}
          onOpenNotifications={() => router.push("/notifications")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});

import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useCallback, useState } from "react";

import { getCurrentUserId } from "@/lib/auth";
import { useNotificationBadge } from "@/pages/notifications";
import { useStories } from "@/pages/stories/business/useStories";
import { NewStoryCamera } from "@/pages/stories/components/NewStoryCamera";
import { StoriesBar } from "@/pages/stories/components/StoriesBar";
import { StorySuccessModal } from "@/pages/stories/components/StorySuccessModal";
import { StoryViewer } from "@/pages/stories/components/StoryViewer";
import { StoryViewersSheet } from "@/pages/stories/components/StoryViewersSheet";
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
    addReply,
    addCameraPhoto,
    cameraPhotos,
    commentsLoadingByPost,
    closeComposer,
    closeNewPostCamera,
    closePostSuccess,
    closeShare,
    deleteComment,
    editComment,
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
    isRefreshing,
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
    refreshFeed,
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
    toggleCommentLike,
  } = useFeed();
  const { hasUnread } = useNotificationBadge();
  const stories = useStories();
  const [isStoryCameraOpen, setIsStoryCameraOpen] = useState(false);
  const [isStorySuccessVisible, setIsStorySuccessVisible] = useState(false);
  const [selectedStoryPhoto, setSelectedStoryPhoto] = useState<string | null>(null);
  const handleRefresh = useCallback(() => {
    void Promise.all([refreshFeed(), stories.loadStories()]);
  }, [refreshFeed, stories]);
  const openUserProfile = (userId: string) => {
    void getCurrentUserId().then((currentUserId) => {
      if (currentUserId === userId) {
        router.push("/profile");
        return;
      }

      router.push({ pathname: "/users/[userId]", params: { userId } });
    });
  };
  const openStoryCamera = () => {
    setSelectedStoryPhoto(null);
    setIsStoryCameraOpen(true);
  };
  const closeStoryCamera = () => {
    setSelectedStoryPhoto(null);
    setIsStoryCameraOpen(false);
  };
  const publishStory = () => {
    if (!selectedStoryPhoto) return;

    void stories.addStory(selectedStoryPhoto).then((published) => {
      if (published) {
        setSelectedStoryPhoto(null);
        setIsStoryCameraOpen(false);
        setIsStorySuccessVisible(true);
      }
    });
  };

  return (
    <View style={styles.container}>
      <FeedList
        posts={posts}
        listRef={listRef}
        commentsLoadingByPost={commentsLoadingByPost}
        isLoadingInitial={isLoadingInitial}
        isLoadingMore={isLoadingMore}
        isRefreshing={isRefreshing}
        listHeaderComponent={
          <StoriesBar
            currentUser={
              stories.currentUser
                ? {
                    userAvatar: stories.currentUser.userAvatar,
                    userName: stories.currentUser.userName,
                  }
                : null
            }
            isUploading={stories.isUploading}
            myStoryGroup={stories.myStoryGroup}
            stories={stories.otherStoryGroups}
            onAddStory={openStoryCamera}
            onOpenMyStories={stories.openMyStories}
            onOpenStory={stories.openStoryGroup}
          />
        }
        onAddComment={addComment}
        onAddReply={addReply}
        onDeleteComment={deleteComment}
        onEditComment={editComment}
        onLoadComments={loadComments}
        onLoadMore={loadMoreFeed}
        onOpenShare={openShare}
        onOpenUserProfile={openUserProfile}
        onPrefetch={handlePrefetch}
        onRefresh={handleRefresh}
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

      <NewStoryCamera
        isPublishing={stories.isUploading}
        selectedPhoto={selectedStoryPhoto}
        visible={isStoryCameraOpen}
        onClose={closeStoryCamera}
        onPublish={publishStory}
        onSelectPhoto={(uri) => setSelectedStoryPhoto(uri || null)}
      />

      <StorySuccessModal
        visible={isStorySuccessVisible}
        onContinue={() => setIsStorySuccessVisible(false)}
      />

      {stories.viewerState && (
        <StoryViewer
          key={`${stories.viewerState.initialGroupIndex}-${stories.viewerState.groups
            .map((group) => group.userId)
            .join("-")}`}
          groups={stories.viewerState.groups}
          initialGroupIndex={stories.viewerState.initialGroupIndex}
          initialStoryIndex={stories.viewerState.initialStoryIndex}
          visible
          onClose={stories.closeStoryViewer}
          onOpenViewers={stories.openViewers}
          onStoryVisible={stories.markAsViewed}
        />
      )}

      <StoryViewersSheet
        isLoading={stories.isLoadingViewers}
        story={stories.viewersStory}
        viewers={stories.viewers}
        onClose={stories.closeViewers}
      />

      {!isComposerOpen && !isCameraOpen && !isStoryCameraOpen && !isStorySuccessVisible && (
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

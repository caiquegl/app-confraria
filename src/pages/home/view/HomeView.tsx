import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useCallback, useState } from "react";

import { getCurrentUserId } from "@/lib/auth";
import { useChatBadge } from "@/pages/messages";
import { useNotificationBadge } from "@/pages/notifications";
import { useStories } from "@/pages/stories/business/useStories";
import { NewStoryCamera } from "@/pages/stories/components/NewStoryCamera";
import { StoriesBar } from "@/pages/stories/components/StoriesBar";
import { StorySuccessModal } from "@/pages/stories/components/StorySuccessModal";
import { StoryViewer } from "@/pages/stories/components/StoryViewer";
import { StoryViewersSheet } from "@/pages/stories/components/StoryViewersSheet";
import type { StoryDraftMedia } from "@/pages/stories/types/stories.types";
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
    addCameraMedia,
    cameraMedia,
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
    composerMedia,
    friends,
    handlePrefetch,
    isCameraOpen,
    isComposerOpen,
    isComposerRestrictedToFollowers,
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
    postUploadProgress,
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
  const { hasUnread: hasUnreadMessages } = useChatBadge();
  const { hasUnread } = useNotificationBadge();
  const stories = useStories();
  const [isStoryCameraOpen, setIsStoryCameraOpen] = useState(false);
  const [isStorySuccessVisible, setIsStorySuccessVisible] = useState(false);
  const [selectedStoryMedia, setSelectedStoryMedia] = useState<StoryDraftMedia | null>(null);
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
    setSelectedStoryMedia(null);
    setIsStoryCameraOpen(true);
  };
  const closeStoryCamera = () => {
    setSelectedStoryMedia(null);
    setIsStoryCameraOpen(false);
  };
  const publishStory = () => {
    if (!selectedStoryMedia) return;

    void stories.addStory(selectedStoryMedia).then((published) => {
      if (published) {
        setSelectedStoryMedia(null);
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
            onOpenSearch={() => router.push("/feed/search")}
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

      <NewPostCamera
        capturedMedia={cameraMedia}
        visible={isCameraOpen}
        onAddMedia={addCameraMedia}
        onClose={closeNewPostCamera}
        onDone={openComposerFromCamera}
        onGallerySelected={openComposerFromGallery}
      />

      <NewPostComposer
        activePhotoIndex={composeActivePhotoIndex}
        audience={composeAudience}
        caption={composeCaption}
        media={composerMedia}
        postUploadProgress={postUploadProgress}
        publishing={isPublishingPost}
        restrictToFollowers={isComposerRestrictedToFollowers}
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
        selectedMedia={selectedStoryMedia}
        uploadProgress={stories.uploadProgress}
        visible={isStoryCameraOpen}
        onClose={closeStoryCamera}
        onPublish={publishStory}
        onSelectMedia={setSelectedStoryMedia}
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
          onToggleLike={stories.toggleLike}
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
          hasUnreadMessages={hasUnreadMessages}
          hasUnreadNotifications={hasUnread}
          onOpenLiked={() => router.push("/feed/liked")}
          onOpenMessages={() => router.push("/messages")}
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

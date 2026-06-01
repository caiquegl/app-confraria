import { memo, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

import type { FeedPost } from "../types/feed.types";
import { FeedActions } from "./FeedActions";
import { FeedCaption } from "./FeedCaption";
import { FeedCardHeader } from "./FeedCardHeader";
import { FeedComments } from "./FeedComments";
import { FeedMediaCarousel } from "./FeedMediaCarousel";

type FeedCardProps = {
  isLoadingComments: boolean;
  onAddComment: (postId: string, text: string) => void;
  onAddReply: (
    postId: string,
    parentCommentId: string,
    text: string,
    replyToCommentId?: string,
  ) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onEditComment: (postId: string, commentId: string, text: string) => void;
  onLoadComments: (postId: string) => void;
  onOpenShare: (post: FeedPost) => void;
  onOpenUserProfile: (userId: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onToggleLike: (postId: string) => void;
  post: FeedPost;
};

function FeedCardInner({
  isLoadingComments,
  onAddComment,
  onAddReply,
  onDeleteComment,
  onEditComment,
  onLoadComments,
  onOpenShare,
  onOpenUserProfile,
  onToggleCommentLike,
  onToggleLike,
  post,
}: FeedCardProps) {
  const [commentsVisible, setCommentsVisible] = useState(false);

  const mediaPhotos = useMemo(() => {
    if (post.photos && post.photos.length > 0) {
      return post.photos;
    }

    return post.eventImage ? [post.eventImage] : [];
  }, [post.eventImage, post.photos]);

  const mediaTitle = post.eventTitle || post.routeTitle || post.caption || "Post da Confraria";

  const handleToggleComments = () => {
    const nextVisible = !commentsVisible;
    setCommentsVisible(nextVisible);

    if (nextVisible) {
      onLoadComments(post.id);
    }
  };

  return (
    <View style={styles.card}>
      <FeedCardHeader post={post} onOpenUserProfile={onOpenUserProfile} />

      {mediaPhotos.length > 0 && <FeedMediaCarousel photos={mediaPhotos} title={mediaTitle} />}

      {post.caption && <FeedCaption text={post.caption} />}

      <FeedActions
        commentCount={post.commentCount}
        commentsVisible={commentsVisible}
        isLiked={post.isLiked ?? false}
        likeCount={post.likeCount}
        onOpenShare={() => onOpenShare(post)}
        onToggleComments={handleToggleComments}
        onToggleLike={() => onToggleLike(post.id)}
      />

      {commentsVisible && (
        <View>
          {isLoadingComments && post.comments.length === 0 && (
            <View style={styles.commentsLoading}>
              <ActivityIndicator color={colors.brandPrimary} size="small" />
            </View>
          )}
          <FeedComments
            comments={post.comments}
            onAddComment={(text) => onAddComment(post.id, text)}
            onAddReply={(parentCommentId, text, replyToCommentId) =>
              onAddReply(post.id, parentCommentId, text, replyToCommentId)
            }
            onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}
            onEditComment={(commentId, text) => onEditComment(post.id, commentId, text)}
            onOpenUserProfile={onOpenUserProfile}
            onToggleCommentLike={(commentId) => onToggleCommentLike(post.id, commentId)}
          />
        </View>
      )}
    </View>
  );
}

export const FeedCard = memo(FeedCardInner);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    elevation: 2,
    overflow: "hidden",
    shadowColor: colors.brandDark,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  commentsLoading: {
    alignItems: "center",
    paddingVertical: 8,
  },
});

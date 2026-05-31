import { memo, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { FeedPost } from "../types/feed.types";
import { FeedActions } from "./FeedActions";
import { FeedCardHeader } from "./FeedCardHeader";
import { FeedComments } from "./FeedComments";
import { FeedMediaCarousel } from "./FeedMediaCarousel";

type FeedCardProps = {
  isLiked: boolean;
  onAddComment: (postId: string, text: string) => void;
  onOpenShare: (post: FeedPost) => void;
  onToggleLike: (postId: string) => void;
  post: FeedPost;
};

function FeedCardInner({ isLiked, onAddComment, onOpenShare, onToggleLike, post }: FeedCardProps) {
  const [commentsVisible, setCommentsVisible] = useState(false);

  const mediaPhotos = useMemo(() => {
    if (post.photos && post.photos.length > 0) {
      return post.photos;
    }

    return post.eventImage ? [post.eventImage] : [];
  }, [post.eventImage, post.photos]);

  const mediaTitle = post.eventTitle || post.routeTitle || post.caption || "Post da Confraria";

  return (
    <View style={styles.card}>
      <FeedCardHeader post={post} />

      {mediaPhotos.length > 0 && <FeedMediaCarousel photos={mediaPhotos} title={mediaTitle} />}

      {post.caption && <Text style={styles.caption}>{post.caption}</Text>}

      <FeedActions
        commentCount={post.commentCount}
        commentsVisible={commentsVisible}
        isLiked={isLiked}
        likeCount={post.likeCount}
        onOpenShare={() => onOpenShare(post)}
        onToggleComments={() => setCommentsVisible((visible) => !visible)}
        onToggleLike={() => onToggleLike(post.id)}
      />

      {commentsVisible && (
        <FeedComments comments={post.comments} onAddComment={(text) => onAddComment(post.id, text)} />
      )}
    </View>
  );
}

export const FeedCard = memo(FeedCardInner);

const styles = StyleSheet.create({
  caption: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
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
});

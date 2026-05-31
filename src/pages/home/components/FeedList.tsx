import { FlatList, StyleSheet, View } from "react-native";

import type { FeedPost } from "../types/feed.types";
import { FeedCard } from "./FeedCard";

type FeedListProps = {
  isPostLiked: (postId: string) => boolean;
  onAddComment: (postId: string, text: string) => void;
  onOpenShare: (post: FeedPost) => void;
  onToggleLike: (postId: string) => void;
  posts: FeedPost[];
};

export function FeedList({
  isPostLiked,
  onAddComment,
  onOpenShare,
  onToggleLike,
  posts,
}: FeedListProps) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => post.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <FeedCard
          post={item}
          isLiked={isPostLiked(item.id)}
          onAddComment={onAddComment}
          onOpenShare={onOpenShare}
          onToggleLike={onToggleLike}
        />
      )}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  separator: {
    height: 14,
  },
});

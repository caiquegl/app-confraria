import { useCallback, useRef } from "react";
import type { ReactElement } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type ViewToken,
} from "react-native";

import { colors } from "@/theme/colors";

import type { FeedPost } from "../types/feed.types";
import { FeedCard } from "./FeedCard";
import { FeedCardSkeleton } from "./FeedCardSkeleton";

type FeedListProps = {
  commentsLoadingByPost: Record<string, boolean>;
  emptyText?: string;
  emptyTitle?: string;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  isRefreshing?: boolean;
  listHeaderComponent?: ReactElement | null;
  listRef?: React.RefObject<FlatList<FeedPost> | null>;
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
  onLoadMore: () => void;
  onOpenShare: (post: FeedPost) => void;
  onOpenUserProfile: (userId: string) => void;
  onPrefetch: (visibleIndex: number) => void;
  onRefresh?: () => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onToggleLike: (postId: string) => void;
  posts: FeedPost[];
};

const viewabilityConfig = {
  itemVisiblePercentThreshold: 40,
};

export function FeedList({
  commentsLoadingByPost,
  emptyText,
  emptyTitle,
  isLoadingInitial,
  isLoadingMore,
  isRefreshing = false,
  listHeaderComponent,
  listRef,
  onAddComment,
  onAddReply,
  onDeleteComment,
  onEditComment,
  onLoadComments,
  onLoadMore,
  onOpenShare,
  onOpenUserProfile,
  onPrefetch,
  onRefresh,
  onToggleCommentLike,
  onToggleLike,
  posts,
}: FeedListProps) {
  const endReachedDuringMountRef = useRef(true);

  const handleEndReached = useCallback(() => {
    if (endReachedDuringMountRef.current || posts.length === 0) return;
    onLoadMore();
  }, [onLoadMore, posts.length]);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;

      const maxVisibleIndex = Math.max(
        ...viewableItems.map((item) => item.index ?? 0),
      );

      onPrefetch(maxVisibleIndex);
      endReachedDuringMountRef.current = false;
    },
    [onPrefetch],
  );

  const renderItem: ListRenderItem<FeedPost> = useCallback(
    ({ item }) => (
      <FeedCard
        post={item}
        isLoadingComments={commentsLoadingByPost[item.id] ?? false}
        onAddComment={onAddComment}
        onAddReply={onAddReply}
        onDeleteComment={onDeleteComment}
        onEditComment={onEditComment}
        onLoadComments={onLoadComments}
        onOpenShare={onOpenShare}
        onOpenUserProfile={onOpenUserProfile}
        onToggleCommentLike={onToggleCommentLike}
        onToggleLike={onToggleLike}
      />
    ),
    [
      commentsLoadingByPost,
      onAddComment,
      onAddReply,
      onDeleteComment,
      onEditComment,
      onLoadComments,
      onOpenShare,
      onOpenUserProfile,
      onToggleCommentLike,
      onToggleLike,
    ],
  );

  if (isLoadingInitial) {
    return (
      <View style={styles.initialSkeleton}>
        <FeedCardSkeleton />
        <FeedCardSkeleton />
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={posts}
      keyExtractor={(post) => post.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={
        <EmptyFeed emptyText={emptyText} emptyTitle={emptyTitle} />
      }
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footerSkeleton}>
            <FeedCardSkeleton />
          </View>
        ) : null
      }
      initialNumToRender={5}
      maxToRenderPerBatch={6}
      refreshing={isRefreshing}
      windowSize={7}
      removeClippedSubviews
      updateCellsBatchingPeriod={50}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      onRefresh={onRefresh}
      onMomentumScrollBegin={() => {
        endReachedDuringMountRef.current = false;
      }}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function EmptyFeed({
  emptyText = "Seja o primeiro a compartilhar um momento na Confraria.",
  emptyTitle = "Nenhum post ainda",
}: {
  emptyText?: string;
  emptyTitle?: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{emptyTitle}</Text>
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: 96,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "800",
  },
  footerSkeleton: {
    marginTop: 14,
  },
  initialSkeleton: {
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  separator: {
    height: 14,
  },
});

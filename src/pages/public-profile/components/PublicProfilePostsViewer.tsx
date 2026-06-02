import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeedCard } from "@/pages/home/components/FeedCard";
import type { FeedPost } from "@/pages/home/types/feed.types";
import { colors } from "@/theme/colors";

type PublicProfilePostsViewerProps = {
  commentsLoadingByPost: Record<string, boolean>;
  hasMore: boolean;
  initialIndex: number;
  isLoadingMore: boolean;
  posts: FeedPost[];
  visible: boolean;
  onAddComment: (postId: string, text: string) => void;
  onAddReply: (
    postId: string,
    parentCommentId: string,
    text: string,
    replyToCommentId?: string,
  ) => void;
  onClose: () => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onEditComment: (postId: string, commentId: string, text: string) => void;
  onLoadComments: (postId: string) => void;
  onLoadMore: () => void;
  onOpenShare: (post: FeedPost) => void;
  onOpenUserProfile: (userId: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onToggleLike: (postId: string) => void;
};

export function PublicProfilePostsViewer({
  commentsLoadingByPost,
  hasMore,
  initialIndex,
  isLoadingMore,
  posts,
  visible,
  onAddComment,
  onAddReply,
  onClose,
  onDeleteComment,
  onEditComment,
  onLoadComments,
  onLoadMore,
  onOpenShare,
  onOpenUserProfile,
  onToggleCommentLike,
  onToggleLike,
}: PublicProfilePostsViewerProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const itemOffsetsRef = useRef<Record<string, number>>({});
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    if (visible) {
      didInitialScrollRef.current = false;
    }
  }, [initialIndex, visible]);

  const scrollToInitialPost = () => {
    if (!visible || didInitialScrollRef.current) return;

    const targetPost = posts[initialIndex];
    if (!targetPost) return;

    const offset = itemOffsetsRef.current[targetPost.id];
    if (typeof offset !== "number") return;

    didInitialScrollRef.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ animated: false, y: Math.max(0, offset - 12) });
    });
  };

  const handleScrollEndReached = (distanceToBottom: number) => {
    if (distanceToBottom < 260 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Fechar post" style={styles.headerButton} onPress={onClose}>
            <Ionicons color={colors.brandDark} name="close" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Posts</Text>
          <View style={styles.headerButtonPlaceholder} />
        </View>

        {posts.length > 0 ? (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToInitialPost}
            onScroll={({ nativeEvent }) => {
              const distanceToBottom =
                nativeEvent.contentSize.height -
                nativeEvent.layoutMeasurement.height -
                nativeEvent.contentOffset.y;
              handleScrollEndReached(distanceToBottom);
            }}
            scrollEventThrottle={400}
          >
            {posts.map((post) => (
              <View
                key={post.id}
                style={styles.postItem}
                onLayout={(event) => {
                  itemOffsetsRef.current[post.id] = event.nativeEvent.layout.y;
                  scrollToInitialPost();
                }}
              >
                <FeedCard
                  post={post}
                  isLoadingComments={commentsLoadingByPost[post.id] ?? false}
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
              </View>
            ))}

            {isLoadingMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator color={colors.brandPrimary} />
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum post para visualizar.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 110,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  empty: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "900",
  },
  loadingMore: {
    alignItems: "center",
    paddingVertical: 18,
  },
  postItem: {
    marginBottom: 14,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
});

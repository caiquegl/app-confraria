import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import {
  fetchChatConversations,
  sendChatMessage,
} from "@/pages/messages/services/messages.service";
import {
  countFeedComments,
  removeCommentFromTree,
  updateCommentInTree,
} from "@/pages/home/business/feed-comments.utils";
import {
  createFeedPostComment,
  deleteFeedPost,
  deleteFeedPostComment,
  FEED_PAGE_SIZE,
  fetchFeedPostComments,
  fetchUserFeedPosts,
  toggleFeedPostCommentLike,
  toggleFeedPostLike,
  updateFeedPostComment,
} from "@/pages/home/services/feed.service";
import type { FeedPost, FeedShareFriend } from "@/pages/home/types/feed.types";

export function usePublicProfilePosts(userId: string) {
  const mountedRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const loadedCommentsRef = useRef<Set<string>>(new Set());
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [commentsLoadingByPost, setCommentsLoadingByPost] = useState<Record<string, boolean>>({});
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const [shareFriends, setShareFriends] = useState<FeedShareFriend[]>([]);
  const [sentFriendId, setSentFriendId] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const updatePost = useCallback((postId: string, updater: (post: FeedPost) => FeedPost) => {
    setPosts((current) => current.map((post) => (post.id === postId ? updater(post) : post)));
  }, []);

  const loadInitial = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const page = await fetchUserFeedPosts(userId, { limit: FEED_PAGE_SIZE });
      if (!mountedRef.current) return;

      setPosts(page.data);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      loadedCommentsRef.current = new Set();
    } catch {
      if (!mountedRef.current) return;
      Toast.show({
        type: "error",
        text1: "Erro ao carregar posts",
        text2: "Não foi possível buscar os posts deste perfil.",
      });
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadInitial();
    });
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || !nextCursorRef.current) {
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await fetchUserFeedPosts(userId, {
        cursor: nextCursorRef.current,
        limit: FEED_PAGE_SIZE,
      });
      if (!mountedRef.current) return;

      setPosts((current) => {
        const existingIds = new Set(current.map((post) => post.id));
        return [...current, ...page.data.filter((post) => !existingIds.has(post.id))];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      if (!mountedRef.current) return;
      Toast.show({
        type: "error",
        text1: "Erro ao carregar mais posts",
        text2: "Tente novamente em instantes.",
      });
    } finally {
      loadingMoreRef.current = false;
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [userId]);

  const loadComments = useCallback(async (postId: string) => {
    if (loadedCommentsRef.current.has(postId)) return;

    setCommentsLoadingByPost((current) => ({ ...current, [postId]: true }));
    try {
      const comments = await fetchFeedPostComments(postId);
      if (!mountedRef.current) return;

      updatePost(postId, (post) => ({ ...post, comments }));
      loadedCommentsRef.current.add(postId);
    } catch {
      if (!mountedRef.current) return;
      Toast.show({
        type: "error",
        text1: "Erro ao carregar comentários",
        text2: "Tente novamente em instantes.",
      });
    } finally {
      if (mountedRef.current) {
        setCommentsLoadingByPost((current) => ({ ...current, [postId]: false }));
      }
    }
  }, [updatePost]);

  const syncPostComments = useCallback(
    async (postId: string) => {
      const comments = await fetchFeedPostComments(postId);
      if (!mountedRef.current) return;

      updatePost(postId, (post) => ({
        ...post,
        commentCount: countFeedComments(comments),
        comments,
      }));
      loadedCommentsRef.current.add(postId);
    },
    [updatePost],
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      try {
        await createFeedPostComment(postId, text);
        if (!mountedRef.current) return;
        await syncPostComments(postId);
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao comentar",
          text2: "Não foi possível enviar o comentário.",
        });
      }
    },
    [syncPostComments],
  );

  const addReply = useCallback(
    async (
      postId: string,
      parentCommentId: string,
      text: string,
      replyToCommentId?: string,
    ) => {
      try {
        await createFeedPostComment(postId, text, parentCommentId, replyToCommentId);
        if (!mountedRef.current) return;
        await syncPostComments(postId);
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao responder",
          text2: "Não foi possível enviar a resposta.",
        });
      }
    },
    [syncPostComments],
  );

  const editComment = useCallback(
    async (postId: string, commentId: string, text: string) => {
      try {
        const updated = await updateFeedPostComment(postId, commentId, text);
        if (!mountedRef.current) return;

        updatePost(postId, (post) => ({
          ...post,
          comments: updateCommentInTree(post.comments, commentId, () => updated),
        }));
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao editar",
          text2: "Não foi possível editar o comentário.",
        });
      }
    },
    [updatePost],
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      try {
        await deleteFeedPostComment(postId, commentId);
        if (!mountedRef.current) return;

        updatePost(postId, (post) => {
          const comments = removeCommentFromTree(post.comments, commentId);
          return {
            ...post,
            commentCount: countFeedComments(comments),
            comments,
          };
        });
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao excluir",
          text2: "Não foi possível excluir o comentário.",
        });
      }
    },
    [updatePost],
  );

  const deletePost = useCallback(async (postId: string) => {
    const previousPosts = posts;

    setPosts((current) => current.filter((post) => post.id !== postId));
    if (sharePost?.id === postId) {
      setSharePost(null);
      setSentFriendId(null);
    }

    try {
      await deleteFeedPost(postId);
      if (!mountedRef.current) return;

      Toast.show({
        type: "success",
        text1: "Post excluído",
        text2: "O post foi removido do seu perfil.",
      });
    } catch {
      if (!mountedRef.current) return;
      setPosts(previousPosts);
      Toast.show({
        type: "error",
        text1: "Erro ao excluir",
        text2: "Não foi possível excluir o post.",
      });
    }
  }, [posts, sharePost?.id]);

  const toggleLike = useCallback(
    async (postId: string) => {
      const currentPost = posts.find((post) => post.id === postId);
      if (!currentPost) return;

      const previousLiked = currentPost.isLiked ?? false;
      const previousCount = currentPost.likeCount;
      const nextLiked = !previousLiked;

      updatePost(postId, (post) => ({
        ...post,
        isLiked: nextLiked,
        likeCount: Math.max(0, previousCount + (nextLiked ? 1 : -1)),
      }));

      try {
        const result = await toggleFeedPostLike(postId);
        if (!mountedRef.current) return;
        updatePost(postId, (post) => ({
          ...post,
          isLiked: result.liked,
          likeCount: result.likeCount,
        }));
      } catch {
        if (!mountedRef.current) return;
        updatePost(postId, (post) => ({
          ...post,
          isLiked: previousLiked,
          likeCount: previousCount,
        }));
        Toast.show({
          type: "error",
          text1: "Erro ao curtir",
          text2: "Não foi possível atualizar a curtida.",
        });
      }
    },
    [posts, updatePost],
  );

  const toggleCommentLike = useCallback(
    async (postId: string, commentId: string) => {
      const currentPost = posts.find((post) => post.id === postId);
      if (!currentPost) return;

      updatePost(postId, (post) => ({
        ...post,
        comments: updateCommentInTree(post.comments, commentId, (comment) => {
          const liked = !(comment.isLiked ?? false);
          const likeCount = Math.max(0, (comment.likeCount ?? 0) + (liked ? 1 : -1));
          return { ...comment, isLiked: liked, likeCount };
        }),
      }));

      try {
        const result = await toggleFeedPostCommentLike(postId, commentId);
        if (!mountedRef.current) return;

        updatePost(postId, (post) => ({
          ...post,
          comments: updateCommentInTree(post.comments, commentId, (comment) => ({
            ...comment,
            isLiked: result.liked,
            likeCount: result.likeCount,
          })),
        }));
      } catch {
        if (!mountedRef.current) return;
        updatePost(postId, (post) => ({
          ...post,
          comments: currentPost.comments,
        }));
      }
    },
    [posts, updatePost],
  );

  const loadShareFriends = useCallback(async () => {
    try {
      const data = await fetchChatConversations();
      if (!mountedRef.current) return;

      setShareFriends(
        data.contacts.map((contact) => ({
          avatar: contact.userAvatar,
          firstName: contact.userName,
          id: contact.userId,
          isFriend: true,
          isPremium: false,
          location: "Confraria",
          userId: contact.userId,
        })),
      );
    } catch {
      if (!mountedRef.current) return;
      setShareFriends([]);
    }
  }, []);

  const openShare = useCallback((post: FeedPost) => {
    setSharePost(post);
    setSentFriendId(null);
    void loadShareFriends();
  }, [loadShareFriends]);

  const closeShare = useCallback(() => {
    setSharePost(null);
    setSentFriendId(null);
  }, []);

  const shareToFriend = useCallback(
    async (friendId: string) => {
      if (!sharePost) return null;

      const text =
        sharePost.caption?.trim() ||
        sharePost.eventTitle ||
        sharePost.routeTitle ||
        "Compartilhou um post com você";

      const result = await sendChatMessage({
        recipientId: friendId,
        sharedPostId: sharePost.id,
        text,
      });

      setSentFriendId(friendId);
      const friend = shareFriends.find((item) => item.id === friendId);

      return {
        conversationId: result.senderConversation.id,
        participantAvatar: friend?.avatar ?? result.senderConversation.participant.userAvatar,
        participantName: friend?.firstName ?? result.senderConversation.participant.userName,
      };
    },
    [shareFriends, sharePost],
  );

  return {
    addComment,
    addReply,
    closeShare,
    commentsLoadingByPost,
    deleteComment,
    deletePost,
    editComment,
    friends: shareFriends,
    hasMore,
    isLoading,
    isLoadingMore,
    loadComments,
    loadMore,
    openShare,
    posts,
    refresh: loadInitial,
    sentFriendId,
    sharePost,
    shareToFriend,
    toggleCommentLike,
    toggleLike,
  };
}

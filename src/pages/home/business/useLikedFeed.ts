import Toast from "react-native-toast-message";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FlatList } from "react-native";

import {
  fetchChatConversations,
  sendChatMessage,
} from "@/pages/messages/services/messages.service";

import {
  countFeedComments,
  removeCommentFromTree,
  updateCommentInTree,
} from "../business/feed-comments.utils";
import {
  createFeedPostComment,
  deleteFeedPostComment,
  FEED_PAGE_SIZE,
  FEED_PREFETCH_INDEX,
  fetchFeedPostComments,
  fetchLikedFeedPosts,
  toggleFeedPostCommentLike,
  toggleFeedPostLike,
  updateFeedPostComment,
} from "../services/feed.service";
import type { FeedPost, FeedShareFriend } from "../types/feed.types";

export function useLikedFeed() {
  const listRef = useRef<FlatList<FeedPost>>(null);
  const loadingMoreRef = useRef(false);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const mountedRef = useRef(true);
  const loadedCommentsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentsLoadingByPost, setCommentsLoadingByPost] = useState<Record<string, boolean>>({});
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const [shareFriends, setShareFriends] = useState<FeedShareFriend[]>([]);
  const [sentFriendId, setSentFriendId] = useState<string | null>(null);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const updatePost = useCallback((postId: string, updater: (post: FeedPost) => FeedPost) => {
    setPosts((current) => current.map((post) => (post.id === postId ? updater(post) : post)));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const page = await fetchLikedFeedPosts({ limit: FEED_PAGE_SIZE });
        if (cancelled || !mountedRef.current) return;

        setPosts(page.data);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
        loadedCommentsRef.current = new Set();
      } catch {
        if (cancelled || !mountedRef.current) return;

        Toast.show({
          type: "error",
          text1: "Erro ao carregar curtidos",
          text2: "Não foi possível buscar os posts curtidos.",
        });
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoadingInitial(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadMoreFeed = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || !nextCursorRef.current) {
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const page = await fetchLikedFeedPosts({
        cursor: nextCursorRef.current,
        limit: FEED_PAGE_SIZE,
      });

      if (!mountedRef.current) return;

      setPosts((current) => {
        const existingIds = new Set(current.map((post) => post.id));
        const newPosts = page.data.filter((post) => !existingIds.has(post.id));
        return [...current, ...newPosts];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      if (!mountedRef.current) return;

      Toast.show({
        type: "error",
        text1: "Erro ao carregar mais posts",
        text2: "Verifique sua conexão e tente novamente.",
      });
    } finally {
      loadingMoreRef.current = false;
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, []);

  const refreshFeed = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    loadingMoreRef.current = false;

    try {
      const page = await fetchLikedFeedPosts({ limit: FEED_PAGE_SIZE });
      if (!mountedRef.current) return;

      setPosts(page.data);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      loadedCommentsRef.current = new Set();
    } catch {
      if (!mountedRef.current) return;

      Toast.show({
        type: "error",
        text1: "Erro ao atualizar curtidos",
        text2: "Não foi possível recarregar os posts curtidos.",
      });
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [isRefreshing]);

  const handlePrefetch = useCallback(
    (visibleIndex: number) => {
      if (visibleIndex >= FEED_PREFETCH_INDEX) {
        void loadMoreFeed();
      }
    },
    [loadMoreFeed],
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

  const toggleLike = useCallback(
    async (postId: string) => {
      const currentPost = posts.find((post) => post.id === postId);
      if (!currentPost) return;

      const previousCount = currentPost.likeCount;

      setPosts((current) => current.filter((post) => post.id !== postId));

      try {
        await toggleFeedPostLike(postId);
      } catch {
        if (!mountedRef.current) return;

        setPosts((current) => {
          if (current.some((post) => post.id === postId)) {
            return current;
          }

          return [{ ...currentPost, isLiked: true, likeCount: previousCount }, ...current];
        });

        Toast.show({
          type: "error",
          text1: "Erro ao curtir",
          text2: "Não foi possível atualizar a curtida.",
        });
      }
    },
    [posts],
  );

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
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Não foi possível enviar o comentário.";

        Toast.show({
          type: "error",
          text1: "Erro ao comentar",
          text2: message,
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
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Não foi possível enviar a resposta.";

        Toast.show({
          type: "error",
          text1: "Erro ao responder",
          text2: message,
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

        Toast.show({
          type: "error",
          text1: "Erro ao curtir",
          text2: "Não foi possível curtir o comentário.",
        });
      }
    },
    [posts, updatePost],
  );

  const openShare = (post: FeedPost) => {
    setSharePost(post);
    setSentFriendId(null);
    void loadShareFriends();
  };

  const closeShare = () => {
    setSharePost(null);
    setSentFriendId(null);
  };

  const shareToFriend = async (friendId: string) => {
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
  };

  return {
    addComment,
    addReply,
    closeShare,
    commentsLoadingByPost,
    deleteComment,
    editComment,
    friends: shareFriends,
    handlePrefetch,
    isLoadingInitial,
    isLoadingMore,
    isRefreshing,
    listRef,
    loadComments,
    loadMoreFeed,
    openShare,
    posts,
    refreshFeed,
    sentFriendId,
    sharePost,
    shareToFriend,
    toggleLike,
    toggleCommentLike,
  };
}

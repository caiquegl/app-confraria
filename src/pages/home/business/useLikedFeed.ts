import Toast from "react-native-toast-message";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FlatList } from "react-native";

import { MOCK_FEED_FRIENDS } from "@/mock/mockFeedFriends";

import {
  createFeedPostComment,
  FEED_PAGE_SIZE,
  FEED_PREFETCH_INDEX,
  fetchFeedPostComments,
  fetchLikedFeedPosts,
  toggleFeedPostLike,
} from "../services/feed.service";
import type { FeedPost } from "../types/feed.types";

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
  const [commentsLoadingByPost, setCommentsLoadingByPost] = useState<Record<string, boolean>>({});
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
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

  const handlePrefetch = useCallback(
    (visibleIndex: number) => {
      if (visibleIndex >= FEED_PREFETCH_INDEX) {
        void loadMoreFeed();
      }
    },
    [loadMoreFeed],
  );

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

  const addComment = useCallback(
    async (postId: string, text: string) => {
      try {
        const comment = await createFeedPostComment(postId, text);
        if (!mountedRef.current) return;

        updatePost(postId, (post) => ({
          ...post,
          commentCount: post.commentCount + 1,
          comments: [...post.comments, comment],
        }));
        loadedCommentsRef.current.add(postId);
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
    [updatePost],
  );

  const openShare = (post: FeedPost) => {
    setSharePost(post);
    setSentFriendId(null);
  };

  const closeShare = () => {
    setSharePost(null);
    setSentFriendId(null);
  };

  const shareToFriend = (friendId: string) => {
    setSentFriendId(friendId);
  };

  return {
    addComment,
    closeShare,
    commentsLoadingByPost,
    friends: MOCK_FEED_FRIENDS,
    handlePrefetch,
    isLoadingInitial,
    isLoadingMore,
    listRef,
    loadComments,
    loadMoreFeed,
    openShare,
    posts,
    sentFriendId,
    sharePost,
    shareToFriend,
    toggleLike,
  };
}

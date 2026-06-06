import Toast from "react-native-toast-message";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FlatList } from "react-native";

import { consumeHighlightPostId } from "@/lib/feed-highlight-store";
import {
  fetchChatConversations,
  sendChatMessage,
} from "@/pages/messages/services/messages.service";
import { fetchOwnProfile } from "@/pages/profile/services/profile.service";

import {
  countFeedComments,
  removeCommentFromTree,
  updateCommentInTree,
} from "../business/feed-comments.utils";
import {
  createFeedPost,
  createFeedPostComment,
  deleteFeedPostComment,
  FEED_PAGE_SIZE,
  FEED_PREFETCH_INDEX,
  fetchFeedPost,
  fetchFeedPostComments,
  fetchFeedPosts,
  toggleFeedPostCommentLike,
  toggleFeedPostLike,
  updateFeedPostComment,
} from "../services/feed.service";
import type { ComposeAudience, FeedPost, FeedShareFriend } from "../types/feed.types";

export function useFeed() {
  const listRef = useRef<FlatList<FeedPost>>(null);
  const loadingMoreRef = useRef(false);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const mountedRef = useRef(true);
  const loadedCommentsRef = useRef<Set<string>>(new Set());
  const postsRef = useRef<FeedPost[]>([]);

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
  const isLoadingInitialRef = useRef(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentsLoadingByPost, setCommentsLoadingByPost] = useState<Record<string, boolean>>({});
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const [shareFriends, setShareFriends] = useState<FeedShareFriend[]>([]);
  const [sentFriendId, setSentFriendId] = useState<string | null>(null);
  const [composerPhotos, setComposerPhotos] = useState<string[]>([]);
  const [composeCaption, setComposeCaption] = useState("");
  const [composeAudience, setComposeAudience] = useState<ComposeAudience>("all");
  const [isComposerRestrictedToFollowers, setIsComposerRestrictedToFollowers] =
    useState(false);
  const [composeActivePhotoIndex, setComposeActivePhotoIndex] = useState(0);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPhotos, setCameraPhotos] = useState<string[]>([]);
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [isPostSuccessVisible, setIsPostSuccessVisible] = useState(false);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    isLoadingInitialRef.current = isLoadingInitial;
  }, [isLoadingInitial]);

  const scrollFeedToTop = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ animated: true, offset: 0 });
    });
  }, []);

  const prioritizePostInFeed = useCallback(
    (currentPosts: FeedPost[], postId: string): FeedPost[] | null => {
      const existingPost = currentPosts.find((post) => post.id === postId);
      if (!existingPost) return null;

      return [existingPost, ...currentPosts.filter((post) => post.id !== postId)];
    },
    [],
  );

  const applyFeedHighlight = useCallback(
    async (postId: string) => {
      const reordered = prioritizePostInFeed(postsRef.current, postId);

      if (reordered) {
        setPosts(reordered);
        scrollFeedToTop();
        return;
      }

      try {
        const post = await fetchFeedPost(postId);
        if (!mountedRef.current) return;

        setPosts((current) => [
          post,
          ...current.filter((currentPost) => currentPost.id !== postId),
        ]);
        scrollFeedToTop();
      } catch {
        if (!mountedRef.current) return;

        Toast.show({
          type: "error",
          text1: "Post não encontrado",
          text2: "Não foi possível localizar a publicação no feed.",
        });
      }
    },
    [prioritizePostInFeed, scrollFeedToTop],
  );

  const updatePost = useCallback((postId: string, updater: (post: FeedPost) => FeedPost) => {
    setPosts((current) => current.map((post) => (post.id === postId ? updater(post) : post)));
  }, []);

  const loadMoreFeed = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || !nextCursorRef.current) {
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const page = await fetchFeedPosts({
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
      const page = await fetchFeedPosts({ limit: FEED_PAGE_SIZE });
      if (!mountedRef.current) return;

      setPosts(page.data);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      loadedCommentsRef.current = new Set();
    } catch {
      if (!mountedRef.current) return;

      Toast.show({
        type: "error",
        text1: "Erro ao atualizar feed",
        text2: "Não foi possível recarregar os posts.",
      });
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [isRefreshing]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const page = await fetchFeedPosts({ limit: FEED_PAGE_SIZE });
        if (cancelled || !mountedRef.current) return;

        setPosts(page.data);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
        loadedCommentsRef.current = new Set();
      } catch {
        if (cancelled || !mountedRef.current) return;

        Toast.show({
          type: "error",
          text1: "Erro ao carregar feed",
          text2: "Não foi possível buscar os posts.",
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

  useFocusEffect(
    useCallback(() => {
      const highlightPostId = consumeHighlightPostId();
      if (!highlightPostId) return;

      let cancelled = false;

      void (async () => {
        while (isLoadingInitialRef.current && !cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        if (cancelled || !mountedRef.current) return;

        await applyFeedHighlight(highlightPostId);
      })();

      return () => {
        cancelled = true;
      };
    }, [applyFeedHighlight]),
  );

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

      const previousLiked = currentPost.isLiked ?? false;
      const previousCount = currentPost.likeCount;
      const optimisticLiked = !previousLiked;
      const optimisticCount = previousCount + (optimisticLiked ? 1 : -1);

      updatePost(postId, (post) => ({
        ...post,
        isLiked: optimisticLiked,
        likeCount: Math.max(0, optimisticCount),
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

  const openComposerWithPhotos = async (uris: string[]) => {
    if (uris.length === 0) return;

    let restrictToFollowers = false;
    try {
      const profile = await fetchOwnProfile();
      restrictToFollowers = !profile.isPublicProfile;
    } catch {
      restrictToFollowers = false;
    }

    setComposerPhotos(uris);
    setComposeActivePhotoIndex(0);
    setComposeCaption("");
    setIsComposerRestrictedToFollowers(restrictToFollowers);
    setComposeAudience(restrictToFollowers ? "friends" : "all");
    setIsComposerOpen(true);
  };

  const openNewPostCamera = () => {
    setCameraPhotos([]);
    setIsCameraOpen(true);
  };

  const closeNewPostCamera = () => {
    setCameraPhotos([]);
    setIsCameraOpen(false);
  };

  const addCameraPhoto = (uri: string) => {
    setCameraPhotos((prev) => [...prev, uri]);
  };

  const openComposerFromCamera = () => {
    if (cameraPhotos.length === 0) {
      Toast.show({
        type: "error",
        text1: "Nenhuma foto",
        text2: "Tire ao menos uma foto para avançar.",
      });
      return;
    }

    void openComposerWithPhotos(cameraPhotos);
    setCameraPhotos([]);
    setIsCameraOpen(false);
  };

  const openComposerFromGallery = (uris: string[]) => {
    void openComposerWithPhotos(uris);
    setCameraPhotos([]);
    setIsCameraOpen(false);
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    setComposerPhotos([]);
    setComposeCaption("");
    setIsComposerRestrictedToFollowers(false);
    setComposeAudience("all");
    setComposeActivePhotoIndex(0);
  };

  const closePostSuccess = () => {
    setIsPostSuccessVisible(false);
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const removeComposerPhoto = (index: number) => {
    setComposerPhotos((prev) => {
      const next = prev.filter((_, photoIndex) => photoIndex !== index);

      if (next.length === 0) {
        setIsComposerOpen(false);
        setComposeCaption("");
        setIsComposerRestrictedToFollowers(false);
        setComposeAudience("all");
        setComposeActivePhotoIndex(0);
        return [];
      }

      setComposeActivePhotoIndex((current) => {
        if (current > next.length - 1) return next.length - 1;
        if (current > index) return current - 1;
        return current;
      });

      return next;
    });
  };

  const reorderComposerPhotos = (fromIndex: number, toIndex: number) => {
    setComposerPhotos((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      setComposeActivePhotoIndex((current) => {
        if (current === fromIndex) return toIndex;
        if (fromIndex < current && toIndex >= current) return current - 1;
        if (fromIndex > current && toIndex <= current) return current + 1;
        return current;
      });

      return next;
    });
  };

  const publishPost = async () => {
    if (composerPhotos.length === 0) return;

    const caption = composeCaption.trim();
    if (!caption) {
      Toast.show({
        type: "error",
        text1: "Legenda obrigatória",
        text2: "Adicione uma legenda antes de compartilhar.",
      });
      return;
    }

    setIsPublishingPost(true);
    try {
      const createdPost = await createFeedPost({
        audience: composeAudience,
        caption,
        photos: composerPhotos,
      });

      setPosts((current) => {
        const withoutDuplicate = current.filter((post) => post.id !== createdPost.id);
        return [{ ...createdPost, isLiked: false }, ...withoutDuplicate];
      });
      closeComposer();
      setIsPostSuccessVisible(true);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : null) ??
        "Não foi possível publicar o post.";

      Toast.show({
        type: "error",
        text1: "Erro ao publicar",
        text2: message,
      });
    } finally {
      setIsPublishingPost(false);
    }
  };

  return {
    addComment,
    addReply,
    addCameraPhoto,
    cameraPhotos,
    closeNewPostCamera,
    closePostSuccess,
    closeShare,
    closeComposer,
    commentsLoadingByPost,
    deleteComment,
    editComment,
    composeActivePhotoIndex,
    composeAudience,
    composeCaption,
    composerPhotos,
    friends: shareFriends,
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
    handlePrefetch,
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
  };
}

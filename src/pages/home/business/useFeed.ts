import { useMemo, useState } from "react";

import { MOCK_FEED_FRIENDS } from "@/mock/mockFeedFriends";

import { fetchMockFeed } from "../services/feed.service";
import type { FeedComment, FeedInteraction, FeedPost } from "../types/feed.types";

const CURRENT_USER = {
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
  id: "current-user",
  name: "Você",
};

export function useFeed() {
  const [interactions, setInteractions] = useState<Record<string, FeedInteraction>>({});
  const [sharePost, setSharePost] = useState<FeedPost | null>(null);
  const [sentFriendId, setSentFriendId] = useState<string | null>(null);

  const posts = useMemo(() => {
    return fetchMockFeed().map((post): FeedPost => {
      const interaction = interactions[post.id];
      if (!interaction) return post;

      return {
        ...post,
        commentCount: post.commentCount + interaction.extraComments.length,
        comments: [...post.comments, ...interaction.extraComments],
        likeCount: post.likeCount + (interaction.liked ? 1 : 0),
      };
    });
  }, [interactions]);

  const isPostLiked = (postId: string) => interactions[postId]?.liked ?? false;

  const toggleLike = (postId: string) => {
    setInteractions((prev) => ({
      ...prev,
      [postId]: {
        extraComments: prev[postId]?.extraComments ?? [],
        liked: !(prev[postId]?.liked ?? false),
      },
    }));
  };

  const addComment = (postId: string, text: string) => {
    const newComment: FeedComment = {
      createdAt: new Date().toISOString(),
      id: `local-${postId}-${Date.now()}`,
      text,
      userAvatar: CURRENT_USER.avatar,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
    };

    setInteractions((prev) => ({
      ...prev,
      [postId]: {
        extraComments: [...(prev[postId]?.extraComments ?? []), newComment],
        liked: prev[postId]?.liked ?? false,
      },
    }));
  };

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
    friends: MOCK_FEED_FRIENDS,
    isPostLiked,
    openShare,
    posts,
    sentFriendId,
    sharePost,
    shareToFriend,
    toggleLike,
  };
}

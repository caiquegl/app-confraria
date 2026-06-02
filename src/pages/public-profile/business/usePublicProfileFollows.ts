import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "react-native-toast-message";

import {
  fetchPublicProfileFollowers,
  fetchPublicProfileFollowing,
  followPublicProfile,
} from "../services/public-profile.service";
import type {
  PublicProfileFollowTab,
  PublicProfileFollowUser,
} from "../types/public-profile.types";

export function usePublicProfileFollows(
  userId: string,
  initialTab: PublicProfileFollowTab,
) {
  const [activeTab, setActiveTab] = useState<PublicProfileFollowTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [followers, setFollowers] = useState<PublicProfileFollowUser[]>([]);
  const [following, setFollowing] = useState<PublicProfileFollowUser[]>([]);
  const [followingLoadingById, setFollowingLoadingById] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollows = useCallback(async () => {
    if (!userId) {
      setError("Perfil inválido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [followersData, followingData] = await Promise.all([
        fetchPublicProfileFollowers(userId),
        fetchPublicProfileFollowing(userId),
      ]);

      setFollowers(followersData);
      setFollowing(followingData);
    } catch {
      setError("Não foi possível carregar seguidores.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => {
      setActiveTab(initialTab);
      void loadFollows();
    });
  }, [initialTab, loadFollows]);

  const activeUsers = activeTab === "followers" ? followers : following;
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeUsers;

    return activeUsers.filter((user) => user.name.toLowerCase().includes(query));
  }, [activeUsers, searchQuery]);

  const markUserAsFollowing = useCallback((targetUserId: string) => {
    const update = (user: PublicProfileFollowUser) =>
      user.userId === targetUserId ? { ...user, isFollowing: true } : user;

    setFollowers((current) => current.map(update));
    setFollowing((current) => current.map(update));
  }, []);

  const followUser = useCallback(
    async (targetUser: PublicProfileFollowUser) => {
      if (targetUser.isSelf || targetUser.isFollowing || followingLoadingById[targetUser.userId]) {
        return;
      }

      setFollowingLoadingById((current) => ({
        ...current,
        [targetUser.userId]: true,
      }));

      try {
        await followPublicProfile(targetUser.userId);
        markUserAsFollowing(targetUser.userId);
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao seguir",
          text2: "Não foi possível seguir este usuário.",
        });
      } finally {
        setFollowingLoadingById((current) => ({
          ...current,
          [targetUser.userId]: false,
        }));
      }
    },
    [followingLoadingById, markUserAsFollowing],
  );

  return {
    activeTab,
    error,
    filteredUsers,
    followersCount: followers.length,
    followingCount: following.length,
    followingLoadingById,
    isLoading,
    retry: loadFollows,
    searchQuery,
    setActiveTab,
    setSearchQuery,
    followUser,
  };
}

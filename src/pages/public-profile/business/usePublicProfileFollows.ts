import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "react-native-toast-message";

import { getCurrentUserId } from "@/lib/auth";

import {
  acceptFollowRequest,
  declineFollowRequest,
  fetchReceivedFollowRequests,
  fetchPublicProfileFollowers,
  fetchPublicProfileFollowing,
  followPublicProfile,
} from "../services/public-profile.service";
import type {
  PublicProfileFollowRequest,
  PublicProfileFollowTab,
  PublicProfileFollowUser,
} from "../types/public-profile.types";

export function usePublicProfileFollows(
  userId: string,
  initialTab: PublicProfileFollowTab,
) {
  const [activeTab, setActiveTab] = useState<PublicProfileFollowTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [canViewRequests, setCanViewRequests] = useState(false);
  const [followers, setFollowers] = useState<PublicProfileFollowUser[]>([]);
  const [following, setFollowing] = useState<PublicProfileFollowUser[]>([]);
  const [requests, setRequests] = useState<PublicProfileFollowRequest[]>([]);
  const [followingLoadingById, setFollowingLoadingById] = useState<Record<string, boolean>>({});
  const [requestLoadingById, setRequestLoadingById] = useState<Record<string, boolean>>({});
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
      const currentUserId = await getCurrentUserId();
      const shouldLoadRequests = currentUserId === userId;
      const [followersData, followingData, requestsData] = await Promise.all([
        fetchPublicProfileFollowers(userId),
        fetchPublicProfileFollowing(userId),
        shouldLoadRequests ? fetchReceivedFollowRequests() : Promise.resolve([]),
      ]);

      setCanViewRequests(shouldLoadRequests);
      setFollowers(followersData);
      setFollowing(followingData);
      setRequests(requestsData);
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
  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((request) => request.name.toLowerCase().includes(query));
  }, [requests, searchQuery]);

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

  const acceptRequest = useCallback(
    async (request: PublicProfileFollowRequest) => {
      if (requestLoadingById[request.requestId]) return;

      setRequestLoadingById((current) => ({
        ...current,
        [request.requestId]: true,
      }));

      try {
        await acceptFollowRequest(request.requestId);
        setRequests((current) =>
          current.filter((item) => item.requestId !== request.requestId),
        );
        void loadFollows();
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao aceitar pedido",
          text2: "Não foi possível aceitar esta solicitação.",
        });
      } finally {
        setRequestLoadingById((current) => ({
          ...current,
          [request.requestId]: false,
        }));
      }
    },
    [loadFollows, requestLoadingById],
  );

  const declineRequest = useCallback(
    async (request: PublicProfileFollowRequest) => {
      if (requestLoadingById[request.requestId]) return;

      setRequestLoadingById((current) => ({
        ...current,
        [request.requestId]: true,
      }));

      try {
        await declineFollowRequest(request.requestId);
        setRequests((current) =>
          current.filter((item) => item.requestId !== request.requestId),
        );
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao recusar pedido",
          text2: "Não foi possível recusar esta solicitação.",
        });
      } finally {
        setRequestLoadingById((current) => ({
          ...current,
          [request.requestId]: false,
        }));
      }
    },
    [requestLoadingById],
  );

  return {
    acceptRequest,
    activeTab,
    canViewRequests,
    declineRequest,
    error,
    filteredRequests,
    filteredUsers,
    followersCount: followers.length,
    followingCount: following.length,
    followingLoadingById,
    isLoading,
    requestLoadingById,
    requestsCount: requests.length,
    retry: loadFollows,
    searchQuery,
    setActiveTab,
    setSearchQuery,
    followUser,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";

import { fetchPublicProfile } from "../services/public-profile.service";
import type {
  FollowProfileResponse,
  PublicProfile,
} from "../types/public-profile.types";

export function usePublicProfile(userId: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const hasAttemptedRef = useRef(false);
  const profileRef = useRef<PublicProfile | null>(null);
  profileRef.current = profile;

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setError("Não foi possível carregar o perfil.");
      setIsLoading(false);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const hasData = profileRef.current != null;
    if (hasAttemptedRef.current && !hasData) {
      setIsRetrying(true);
    } else if (!hasData) {
      setIsLoading(true);
    }

    try {
      const data = await fetchPublicProfile(userId);
      setProfile(data);
      setError(null);
    } catch {
      if (hasData) {
        Toast.show({
          type: "error",
          text1: "Não foi possível atualizar o perfil",
          text2: "Mantivemos os dados anteriores.",
        });
      } else {
        setError("Não foi possível carregar o perfil.");
      }
    } finally {
      hasAttemptedRef.current = true;
      inFlightRef.current = false;
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile();
    });
  }, [loadProfile]);

  const updateFollowState = useCallback((result: FollowProfileResponse) => {
    setProfile((current) =>
      current
        ? {
            ...current,
            followersCount: result.followersCount,
            followStatus: result.followStatus,
            followingCount: result.followingCount,
            hasPendingFollowRequest: result.hasPendingFollowRequest,
            isFollowing: result.isFollowing,
          }
        : current,
    );
  }, []);

  return {
    error,
    isLoading,
    isRetrying,
    profile,
    retry: loadProfile,
    updateFollowState,
  };
}

import { useCallback, useEffect, useState } from "react";

import { fetchPublicProfile } from "../services/public-profile.service";
import type {
  FollowProfileResponse,
  PublicProfile,
} from "../types/public-profile.types";

export function usePublicProfile(userId: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setError("Perfil inválido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPublicProfile(userId);
      setProfile(data);
    } catch {
      setError("Não foi possível carregar o perfil.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateFollowState = useCallback((result: FollowProfileResponse) => {
    setProfile((current) =>
      current
        ? {
            ...current,
            followersCount: result.followersCount,
            followingCount: result.followingCount,
            isFollowing: result.isFollowing,
          }
        : current,
    );
  }, []);

  return {
    error,
    isLoading,
    profile,
    retry: loadProfile,
    updateFollowState,
  };
}

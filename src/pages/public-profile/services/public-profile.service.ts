import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  FollowProfileResponse,
  PublicProfile,
  PublicProfileFollowRequest,
  PublicProfileFollowUser,
} from "../types/public-profile.types";

export async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
  const { data } = await api.get<PublicProfile>(apiRoutes.users.publicProfile(userId));
  return data;
}

export async function fetchPublicProfileFollowers(
  userId: string,
): Promise<PublicProfileFollowUser[]> {
  const { data } = await api.get<PublicProfileFollowUser[]>(
    apiRoutes.users.followers(userId),
  );
  return data;
}

export async function fetchPublicProfileFollowing(
  userId: string,
): Promise<PublicProfileFollowUser[]> {
  const { data } = await api.get<PublicProfileFollowUser[]>(
    apiRoutes.users.following(userId),
  );
  return data;
}

export async function followPublicProfile(
  userId: string,
): Promise<FollowProfileResponse> {
  const { data } = await api.post<FollowProfileResponse>(apiRoutes.users.follow(userId));
  return data;
}

export async function unfollowPublicProfile(
  userId: string,
): Promise<FollowProfileResponse> {
  const { data } = await api.delete<FollowProfileResponse>(apiRoutes.users.follow(userId));
  return data;
}

export async function fetchReceivedFollowRequests(): Promise<
  PublicProfileFollowRequest[]
> {
  const { data } = await api.get<PublicProfileFollowRequest[]>(
    apiRoutes.users.followRequests,
  );
  return data;
}

export async function acceptFollowRequest(requestId: string): Promise<void> {
  await api.post(apiRoutes.users.followRequestAccept(requestId));
}

export async function declineFollowRequest(requestId: string): Promise<void> {
  await api.delete(apiRoutes.users.followRequestDecline(requestId));
}

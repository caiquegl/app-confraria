import { MOCK_FEED } from "@/mock/mockFeed";

import type { FeedPost } from "../types/feed.types";

export function fetchMockFeed(): FeedPost[] {
  return MOCK_FEED;
}

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `há ${minutes}min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

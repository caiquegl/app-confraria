import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";

export type FavoriteTab = "services" | "events" | "routes";

export type FavoriteTabItem = {
  count: number;
  key: FavoriteTab;
  label: string;
};

export type FavoriteEvent = PublicProfileEvent;

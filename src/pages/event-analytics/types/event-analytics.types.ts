import type { EventDetail } from "@/pages/event-detail/types/event-detail.types";

export type EventAnalyticsTab = "detalhes" | "analiticas";

export type EventAnalyticsParticipant = {
  avatarUrl: string | null;
  id: string;
  joinedAt: string;
  name: string;
};

export type EventAnalytics = EventDetail & {
  canEdit: boolean;
  participants: EventAnalyticsParticipant[];
  signupsLast7Days: number;
};

import type { FeedShareFriend } from "@/pages/home/types/feed.types";

export const MOCK_FEED_FRIENDS: FeedShareFriend[] = [
  {
    id: "friend-1",
    userId: "user-feed-3",
    firstName: "Fernanda Lima",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
    location: "São Paulo, SP",
    isFriend: true,
    isPremium: true,
  },
  {
    id: "friend-2",
    userId: "user-feed-4",
    firstName: "Paulo Siqueira",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
    location: "Campinas, SP",
    isFriend: true,
    isPremium: false,
  },
  {
    id: "friend-3",
    userId: "user-feed-5",
    firstName: "Camila Ferreira",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    location: "Curitiba, PR",
    isFriend: true,
    isPremium: true,
  },
  {
    id: "friend-4",
    userId: "user-feed-9",
    firstName: "Bruno Castilho",
    avatar:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop",
    location: "Belo Horizonte, MG",
    isFriend: true,
    isPremium: false,
  },
];

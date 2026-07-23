import type { EventsDiscoverQueryFilters } from "@/pages/events/utils/events-filters.utils";

function appendDiscoverQueryFilters(
  params: URLSearchParams,
  filters?: EventsDiscoverQueryFilters,
) {
  if (!filters) {
    return;
  }

  if (filters.category) params.set("category", filters.category);
  if (filters.state) params.set("state", filters.state);
  if (filters.latitude !== undefined) params.set("latitude", String(filters.latitude));
  if (filters.longitude !== undefined) params.set("longitude", String(filters.longitude));
  if (filters.minDistanceKm !== undefined) {
    params.set("minDistanceKm", String(filters.minDistanceKm));
  }
  if (filters.maxDistanceKm !== undefined) {
    params.set("maxDistanceKm", String(filters.maxDistanceKm));
  }
}

export const apiRoutes = {
  admin: {
    bikeBrands: "/admin/bike-brands",
    bikeCategories: "/admin/bike-categories",
    curvePreferences: "/admin/curve-preferences",
    eventCategories: "/admin/event-categories",
    ridingCompanions: "/admin/riding-companions",
    termsLatest: "/admin/terms/latest",
    tripStyles: "/admin/trip-styles",
  },
  chat: {
    conversations: "/chat/conversations",
    conversationRead: (conversationId: string) =>
      `/chat/conversations/${conversationId}/read`,
    messages: (conversationId: string) =>
      `/chat/conversations/${conversationId}/messages`,
    messageReaction: (messageId: string) => `/chat/messages/${messageId}/reactions`,
    sendMessage: "/chat/messages",
    unreadCount: "/chat/unread-count",
  },
  events: {
    analytics: (eventId: string) => `/events/${eventId}/analytics`,
    create: "/events",
    delete: (eventId: string) => `/events/${eventId}`,
    detail: (eventId: string) => `/events/${eventId}`,
    discover: (
      scope: string,
      options?: {
        category?: string;
        filters?: EventsDiscoverQueryFilters;
      },
    ) => {
      const params = new URLSearchParams({ scope });
      if (options?.category?.trim()) {
        params.set("category", options.category.trim());
      }
      appendDiscoverQueryFilters(params, options?.filters);
      return `/events/discover?${params.toString()}`;
    },
    discoverSections: (filters?: EventsDiscoverQueryFilters) => {
      const params = new URLSearchParams();
      appendDiscoverQueryFilters(params, filters);
      const query = params.toString();
      return `/events/discover/sections${query ? `?${query}` : ""}`;
    },
    favorite: (eventId: string) => `/events/${eventId}/favorite`,
    favorites: "/events/favorites",
    join: (eventId: string) => `/events/${eventId}/join`,
    update: (eventId: string) => `/events/${eventId}`,
    userCreated: (userId: string, query?: string) =>
      `/events/users/${userId}/created${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    userJoined: (userId: string, query?: string) =>
      `/events/users/${userId}/joined${query ? `?q=${encodeURIComponent(query)}` : ""}`,
  },
  feed: {
    posts: "/feed/posts",
    likedPosts: "/feed/posts/liked",
    post: (postId: string) => `/feed/posts/${postId}`,
    postComments: (postId: string) => `/feed/posts/${postId}/comments`,
    postComment: (postId: string, commentId: string) =>
      `/feed/posts/${postId}/comments/${commentId}`,
    postCommentLike: (postId: string, commentId: string) =>
      `/feed/posts/${postId}/comments/${commentId}/like`,
    postLike: (postId: string) => `/feed/posts/${postId}/like`,
    userPosts: (userId: string) => `/feed/users/${userId}/posts`,
  },
  notifications: {
    list: "/notifications",
    pushToken: "/notifications/push-token",
    readAll: "/notifications/read-all",
    unreadCount: "/notifications/unread-count",
  },
  places: {
    autocomplete: (input: string) => `/places/autocomplete?input=${encodeURIComponent(input)}`,
    details: (placeId: string) => `/places/details?placeId=${encodeURIComponent(placeId)}`,
    directions: "/places/directions",
    estimateFuel: "/places/estimate-fuel",
    nearby: "/places/nearby",
    import: "/places/import",
    live: (googlePlaceId: string) =>
      `/places/live/${encodeURIComponent(googlePlaceId)}`,
  },
  routes: {
    create: "/routes",
    mine: "/routes/me",
    detail: (routeId: string) => `/routes/${routeId}`,
    update: (routeId: string) => `/routes/${routeId}`,
    updateStatus: (routeId: string) => `/routes/${routeId}/status`,
    delete: (routeId: string) => `/routes/${routeId}`,
    addStop: (dayId: string) => `/routes/days/${dayId}/stops`,
    removeStop: (dayId: string, placeId: string) =>
      `/routes/days/${dayId}/stops/${placeId}`,
  },
  quickRides: {
    list: (options?: { city?: string; region?: string; state?: string }) => {
      const params = new URLSearchParams();
      if (options?.city?.trim()) params.set("city", options.city.trim());
      if (options?.region?.trim()) params.set("region", options.region.trim());
      if (options?.state?.trim()) params.set("state", options.state.trim());
      const query = params.toString();
      return `/quick-rides${query ? `?${query}` : ""}`;
    },
    create: "/quick-rides",
    detail: (quickRideId: string) => `/quick-rides/${quickRideId}`,
    join: (quickRideId: string) => `/quick-rides/${quickRideId}/join`,
    mine: "/quick-rides/me",
    update: (quickRideId: string) => `/quick-rides/${quickRideId}`,
    cancel: (quickRideId: string) => `/quick-rides/${quickRideId}`,
  },
  services: {
    list: (category?: string) => {
      const trimmed = category?.trim();
      return trimmed && trimmed !== "Tudo"
        ? `/services?category=${encodeURIComponent(trimmed)}`
        : "/services";
    },
    create: "/services",
    detail: (serviceId: string) => `/services/${serviceId}`,
    update: (serviceId: string) => `/services/${serviceId}`,
    delete: (serviceId: string) => `/services/${serviceId}`,
    favorite: (serviceId: string) => `/services/${serviceId}/favorite`,
    reviews: (serviceId: string) => `/services/${serviceId}/reviews`,
  },
  stories: {
    create: "/stories",
    delete: (storyId: string) => `/stories/${storyId}`,
    feed: "/stories/feed",
    like: (storyId: string) => `/stories/${storyId}/like`,
    markViewed: (storyId: string) => `/stories/${storyId}/view`,
    userStories: (userId: string) => `/stories/users/${userId}`,
    viewers: (storyId: string) => `/stories/${storyId}/viewers`,
  },
  userBikes: {
    list: "/user-bikes",
    detail: (bikeId: string) => `/user-bikes/${bikeId}`,
  },
  users: {
    checkEmail: (email: string) => `/users/check-email/${encodeURIComponent(email)}`,
    checkCpf: (cpf: string) => `/users/check-cpf/${encodeURIComponent(cpf)}`,
    follow: (userId: string) => `/users/${userId}/follow`,
    followRequests: "/users/me/follow-requests",
    followRequestAccept: (requestId: string) =>
      `/users/follow-requests/${requestId}/accept`,
    followRequestDecline: (requestId: string) =>
      `/users/follow-requests/${requestId}`,
    followers: (userId: string) => `/users/${userId}/followers`,
    following: (userId: string) => `/users/${userId}/following`,
    forgotPassword: "/users/forgot-password",
    login: "/users/login",
    me: "/users/me",
    mePassword: "/users/me/password",
    publicProfile: (userId: string) => `/users/${userId}/public-profile`,
    register: "/users/register",
    resetPassword: "/users/reset-password",
    search: (query: string) => `/users/search?q=${encodeURIComponent(query)}`,
    verifyResetCode: "/users/verify-reset-code",
  },
} as const;

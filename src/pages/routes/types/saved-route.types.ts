export type RouteStatus = "draft" | "scheduled" | "in_progress" | "finished";

export type RouteKind = "quick" | "planned";

export type RouteInvitationStatus = "pending" | "accepted" | "declined";

export type RouteInvitationResponse = {
  id: string;
  status: RouteInvitationStatus;
};

export type RouteParticipantResponse = {
  avatarUrl: string | null;
  id: string;
  joinedAt: string;
  name: string;
  userId: string;
};

export type RoutePendingInviteResponse = {
  avatarUrl: string | null;
  invitedAt: string;
  name: string;
  userId: string;
};

export type RouteCreateAction = "start_now" | "save_for_later" | "save_draft";

export type RelativePeriod = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "UPCOMING" | "NO_DATE";

export type RouteStatusFilter = "SCHEDULED" | "NO_DATE" | "OFFLINE";

export type RouteCompletionFilter = "ALL" | "TRAVELED" | "PLANNED";

export type SavedRouteFilters = {
  bike: string;
  completion: RouteCompletionFilter;
  endDate: string;
  period: RelativePeriod;
  startDate: string;
  statuses: RouteStatusFilter[];
};

export type SavedRouteDay = {
  dayNumber: number;
  id: string;
  label: string;
  overnight: boolean;
};

export type SavedRouteCreator = {
  avatarUrl: string | null;
  id: string;
  name: string;
};

export type RouteMyReview = {
  comment: string | null;
  createdAt: string;
  rating: number;
};

export type SavedRoute = {
  avoidTolls: boolean;
  bikeId: string;
  bikeName: string;
  createdAt: string;
  creator: SavedRouteCreator | null;
  dayCount: number;
  days: SavedRouteDay[];
  destinationLabel: string;
  distanceLabel: string;
  durationLabel: string;
  finishedAt: string | null;
  fuelCost: number | null;
  hasOvernight: boolean;
  id: string;
  kind: RouteKind;
  myReview: RouteMyReview | null;
  optimizeFuel: boolean;
  originLabel: string;
  startsAt: string;
  startedAt: string | null;
  status: RouteStatus;
  title: string;
  tollCost: number | null;
  tripDate: string;
  tripNote: string | null;
  tripTime: string;
  updatedAt: string;
};

export type SavedRouteGroup = {
  label: string;
  routes: SavedRoute[];
};

export type CreateRoutePayload = {
  action: RouteCreateAction;
  days: Array<{
    destination: {
      description: string;
      latitude: number;
      longitude: number;
      mainText: string;
      placeId: string;
      secondaryText: string;
    };
    distanceMeters?: number;
    durationSeconds?: number;
    label: string;
    origin: {
      description: string;
      latitude: number;
      longitude: number;
      mainText: string;
      placeId: string;
      secondaryText: string;
    };
    overnight?: boolean;
    stops: Array<{
      description: string;
      latitude: number;
      longitude: number;
      mainText: string;
      placeId: string;
      secondaryText: string;
    }>;
  }>;
  motorcycle: {
    bikeId: string;
  };
  preferences: {
    avoidTolls: boolean;
    optimizeFuel: boolean;
  };
  schedule?: {
    tripDate?: string;
    tripNote?: string;
    tripTime?: string;
  };
  kind?: RouteKind;
  totals?: {
    distanceMeters?: number;
    durationSeconds?: number;
    fuelCost?: number;
    tollCost?: number;
  };
};

export type RoutePlaceResponse = {
  description: string;
  id: string;
  latitude: number;
  longitude: number;
  mainText: string;
  order: number;
  placeId: string;
  region: string | null;
  role: "origin" | "destination" | "stop";
  secondaryText: string | null;
};

export type RouteDayApiResponse = {
  dayNumber: number;
  distanceMeters: number | null;
  durationSeconds: number | null;
  id: string;
  label: string;
  overnight: boolean;
  places: RoutePlaceResponse[];
};

export type RouteApiResponse = {
  avoidTolls: boolean;
  bike: {
    id: string;
    imageUrl: string | null;
    name: string;
  };
  createdAt: string;
  createdBy: {
    avatarUrl: string | null;
    id: string;
    name: string;
  };
  createdById: string;
  days: RouteDayApiResponse[];
  destinationLabel: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
  finishedAt: string | null;
  fuelCost: number | null;
  id: string;
  invitation: RouteInvitationResponse | null;
  isOwner: boolean;
  isParticipant: boolean;
  isPublished: boolean;
  kind: RouteKind;
  myReview: RouteMyReview | null;
  optimizeFuel: boolean;
  originLabel: string;
  participants: RouteParticipantResponse[];
  pendingInvites: RoutePendingInviteResponse[];
  publishedAt: string | null;
  rating: number | null;
  reviewCount: number;
  startedAt: string | null;
  startsAt: string;
  status: RouteStatus;
  title: string;
  tollCost: number | null;
  tripNote: string | null;
  updatedAt: string;
  userBikeId: string;
};

export type UpsertRouteReviewPayload = {
  comment?: string;
  rating: number;
};

export type UpsertRouteReviewResponse = {
  review: {
    comment: string | null;
    createdAt: string;
    id: string;
    isMine: boolean;
    rating: number;
    userAvatarUrl: string | null;
    userId: string;
    userName: string;
  };
  route: RouteApiResponse;
};

export type UpdateRoutePayload = Omit<CreateRoutePayload, "action">;

export type PublishedRoutesPageResponse = {
  data: RouteApiResponse[];
  hasMore: boolean;
  nextCursor: string | null;
};

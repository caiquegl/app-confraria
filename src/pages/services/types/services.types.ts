export type ServiceCategory =
  | "Tudo"
  | "Próximos"
  | "Acessórios"
  | "Mecânicas"
  | "Moto escolas"
  | "Guinchos"
  | "Hotéis";

export type Service = {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  phone: string | null;
  isFavorited?: boolean;
  source?: string;
  googlePlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  googleRating?: number | null;
  googleRatingCount?: number | null;
};

export type ServicesSection = {
  category: string;
  services: Service[];
};

export type ServiceReview = {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  rating: number;
  comment: string | null;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertReviewPayload = {
  rating: number;
  comment?: string;
};

/** Categorias suportadas pela busca "Próximos" (Google Places) */
export const NEARBY_CATEGORIES = [
  "Postos de Gasolina",
  "Mecânicas",
  "Borracharias",
  "Restaurantes",
  "Hotéis",
  "Shoppings",
] as const;

export type NearbyCategory = (typeof NEARBY_CATEGORIES)[number];

export type NearbyPlace = {
  googlePlaceId: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  googleRating: number | null;
  googleRatingCount: number | null;
  openNow: boolean | null;
  primaryType: string | null;
};

export type NearbySection = {
  category: NearbyCategory;
  places: NearbyPlace[];
};

export type PlaceLiveInfo = {
  address: string | null;
  googleRating: number | null;
  googleRatingCount: number | null;
  openNow: boolean | null;
  website: string | null;
  weekdayText: string[];
};

export type ImportPlaceResponse = {
  service: Service;
  live: PlaceLiveInfo;
};

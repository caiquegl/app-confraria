export type ServiceCategory =
  | "Tudo"
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
  phone: string;
  isFavorited?: boolean;
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

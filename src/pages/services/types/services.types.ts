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
  category: ServiceCategory;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  phone: string;
  isFavorited?: boolean;
};

export type ServicesSection = {
  category: ServiceCategory;
  services: Service[];
};

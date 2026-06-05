export type BikeBrand = {
  id: string;
  name: string;
};

export type UserBike = {
  id: string;
  brand: BikeBrand;
  model: string;
  year: number;
  baseConsumption: number;
  tankCapacity: number;
  isMainBike: boolean;
  imageUrl: string | null;
  category: string | null;
  color: string | null;
  licensePlate: string | null;
  mileage: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SaveUserBikePayload = {
  brandId: string;
  model: string;
  year: number;
  baseConsumption: number;
  tankCapacity: number;
  isMainBike: boolean;
  imageUri?: string | null;
  category?: string;
  color?: string;
  licensePlate?: string;
  mileage?: number | null;
};

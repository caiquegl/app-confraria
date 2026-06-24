import type { FuelCostEstimate } from "@/lib/places/types";

export type RouteCostEstimate = {
  fuel: FuelCostEstimate | null;
  fuelCost: number | null;
  isLoading: boolean;
  tollAvailable: boolean;
  tollCost: number | null;
  tollCount: number | null;
  totalCost: number | null;
};

import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type {
  CheckoutResponse,
  SubscriptionMe,
  SubscriptionPlanCode,
} from "../types/subscription.types";

export async function fetchSubscriptionMe(): Promise<SubscriptionMe> {
  const { data } = await api.get<SubscriptionMe>(apiRoutes.subscriptions.me);
  return data;
}

export async function createSubscriptionCheckout(
  plan: SubscriptionPlanCode,
): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>(
    apiRoutes.subscriptions.checkout,
    { plan },
  );
  return data;
}

export async function changeSubscriptionPlan(
  plan: SubscriptionPlanCode,
): Promise<SubscriptionMe> {
  const { data } = await api.post<SubscriptionMe>(
    apiRoutes.subscriptions.changePlan,
    { plan },
  );
  return data;
}

export async function cancelSubscription(): Promise<SubscriptionMe> {
  const { data } = await api.post<SubscriptionMe>(
    apiRoutes.subscriptions.cancel,
  );
  return data;
}

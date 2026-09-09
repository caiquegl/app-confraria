import type { Purchase } from "expo-iap";

export function isAppleIapPlatform(): boolean {
  return false;
}

export async function ensureAppleIapConnection(): Promise<void> {
  throw new Error("Apple IAP indisponível nesta plataforma");
}

export async function resolvePurchaseJws(_purchase: Purchase): Promise<string> {
  throw new Error("Apple IAP indisponível nesta plataforma");
}

export async function purchaseAppleSubscription(_productId: string): Promise<Purchase> {
  throw new Error("Apple IAP indisponível nesta plataforma");
}

export async function restoreApplePurchases(): Promise<Purchase[]> {
  return [];
}

export async function finishApplePurchase(_purchase: Purchase): Promise<void> {}

export async function openAppleSubscriptionManagement(): Promise<void> {
  throw new Error("Gestão de assinatura Apple só no iOS");
}

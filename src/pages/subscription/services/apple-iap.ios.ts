import { Platform } from "react-native";
import {
  deepLinkToSubscriptions,
  finishTransaction,
  getAvailablePurchases,
  getTransactionJwsIOS,
  initConnection,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from "expo-iap";

import { appLog } from "@/lib/app-log";

let connectionPromise: Promise<boolean> | null = null;

export function isAppleIapPlatform(): boolean {
  return Platform.OS === "ios";
}

export async function ensureAppleIapConnection(): Promise<void> {
  if (!isAppleIapPlatform()) {
    throw new Error("Apple IAP só está disponível no iOS");
  }

  if (!connectionPromise) {
    connectionPromise = initConnection()
      .then(() => true)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}

export async function resolvePurchaseJws(purchase: Purchase): Promise<string> {
  if (purchase.purchaseToken && purchase.purchaseToken.split(".").length >= 3) {
    return purchase.purchaseToken;
  }

  try {
    const jws = await getTransactionJwsIOS(purchase.productId);
    if (jws) return jws;
  } catch {
    // fallback abaixo
  }

  throw new Error("Não foi possível obter a assinatura JWS da compra Apple");
}

export async function purchaseAppleSubscription(productId: string): Promise<Purchase> {
  await ensureAppleIapConnection();
  appLog.info("apple.iap.purchase.start", { productId });

  try {
    const result = await requestPurchase({
      request: {
        apple: { sku: productId },
      },
      type: "subs",
    });

    const purchase = Array.isArray(result) ? result[0] : result;
    if (!purchase || typeof purchase !== "object" || !("productId" in purchase)) {
      throw new Error("Compra Apple sem retorno de transação");
    }

    appLog.info("apple.iap.purchase.success", {
      productId: purchase.productId,
      transactionId: purchase.transactionId,
    });
    return purchase;
  } catch (error) {
    appLog.warn("apple.iap.purchase.fail", {
      message: error instanceof Error ? error.message : String(error),
      productId,
    });
    throw error;
  }
}

export async function restoreApplePurchases(): Promise<Purchase[]> {
  await ensureAppleIapConnection();
  appLog.info("apple.iap.restore.start");

  try {
    await restorePurchases();
    const purchases = await getAvailablePurchases({
      onlyIncludeActiveItemsIOS: true,
    });
    appLog.info("apple.iap.restore.success", {
      count: purchases.length,
      productIds: purchases.map((item) => item.productId),
    });
    return purchases;
  } catch (error) {
    appLog.warn("apple.iap.restore.fail", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function finishApplePurchase(purchase: Purchase): Promise<void> {
  await finishTransaction({ isConsumable: false, purchase });
}

export async function openAppleSubscriptionManagement(): Promise<void> {
  appLog.info("apple.iap.manage.open");
  await deepLinkToSubscriptions({});
}

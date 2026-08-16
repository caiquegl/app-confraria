import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Updates from "expo-updates";

import type { AppVersionPolicy } from "@/lib/app-version-policy";
import { OTA_VERSION } from "@/lib/ota-version";

export const DEFAULT_STORE_MESSAGE =
  "Há uma nova versão do Confraria. Atualize na loja para continuar.";
export const DEFAULT_OTA_MESSAGE =
  "Há uma atualização pronta. Feche o app e abra novamente para instalar automaticamente.";

const ANDROID_PACKAGE = "com.caiquegl22.appconfraria";

export type ForceUpdateKind = "store" | "ota";

export type ForceUpdateDecision = {
  kind: ForceUpdateKind;
  message: string;
  storeUrl: string | null;
};

export function getClientAppVersion(): string {
  return Constants.expoConfig?.version?.trim() || "0.0.0";
}

export function getClientOtaChannel(): string {
  const channel = Updates.channel?.trim();
  if (channel === "preview") return "preview";
  return "production";
}

export function evaluateForceUpdate(
  policy: AppVersionPolicy,
): ForceUpdateDecision | null {
  const minAppVersion = policy.minAppVersion?.trim() || null;
  if (minAppVersion && isSemverLess(getClientAppVersion(), minAppVersion)) {
    return {
      kind: "store",
      message: policy.messageStore?.trim() || DEFAULT_STORE_MESSAGE,
      storeUrl: resolveStoreUrl(policy),
    };
  }

  const minOtaVersion =
    typeof policy.minOtaVersion === "number" && Number.isFinite(policy.minOtaVersion)
      ? policy.minOtaVersion
      : null;

  if (minOtaVersion != null && OTA_VERSION < minOtaVersion) {
    return {
      kind: "ota",
      message: policy.messageOta?.trim() || DEFAULT_OTA_MESSAGE,
      storeUrl: null,
    };
  }

  return null;
}

export function resolveStoreUrl(policy: AppVersionPolicy): string | null {
  if (Platform.OS === "ios") {
    return policy.iosStoreUrl?.trim() || null;
  }

  if (Platform.OS === "android") {
    return (
      policy.androidStoreUrl?.trim() ||
      `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
    );
  }

  return policy.androidStoreUrl?.trim() || policy.iosStoreUrl?.trim() || null;
}

function isSemverLess(current: string, minimum: string): boolean {
  const left = parseSemver(current);
  const right = parseSemver(minimum);

  for (let index = 0; index < 3; index += 1) {
    if (left[index] < right[index]) return true;
    if (left[index] > right[index]) return false;
  }

  return false;
}

function parseSemver(value: string): [number, number, number] {
  const [major = "0", minor = "0", patch = "0"] = value
    .trim()
    .replace(/^v/i, "")
    .split(".");

  return [
    Number.parseInt(major, 10) || 0,
    Number.parseInt(minor, 10) || 0,
    Number.parseInt(patch, 10) || 0,
  ];
}

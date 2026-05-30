import Constants from "expo-constants";
import * as Updates from "expo-updates";

export type UpdateInfo = {
  appVersion: string;
  channel: string;
  label: string;
  runtimeVersion: string;
  updatedAt: string | null;
};

export function getUpdateInfo(): UpdateInfo {
  const appVersion = Constants.expoConfig?.version ?? "—";
  const runtimeVersion = Updates.runtimeVersion ?? appVersion;
  const channel = Updates.channel ?? (__DEV__ ? "development" : "—");

  if (__DEV__) {
    return {
      appVersion,
      channel,
      label: "Dev (sem OTA)",
      runtimeVersion,
      updatedAt: null,
    };
  }

  if (!Updates.isEnabled) {
    return {
      appVersion,
      channel,
      label: "OTA desabilitado",
      runtimeVersion,
      updatedAt: null,
    };
  }

  if (Updates.isEmbeddedLaunch || !Updates.updateId) {
    return {
      appVersion,
      channel,
      label: "Build nativa",
      runtimeVersion,
      updatedAt: null,
    };
  }

  const shortId = Updates.updateId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const updatedAt = Updates.createdAt
    ? Updates.createdAt.toLocaleDateString("pt-BR", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return {
    appVersion,
    channel,
    label: shortId,
    runtimeVersion,
    updatedAt,
  };
}

/** Tempo máximo aguardando verificação/download — evita travar na splash. */
const UPDATE_TIMEOUT_MS = 8000;

/**
 * Verifica e baixa updates OTA em background.
 * O update é aplicado no próximo cold start (sem reloadAsync na splash).
 */
export async function checkAndDownloadUpdate(): Promise<void> {
  if (__DEV__) return;

  let isEnabled = false;
  try {
    isEnabled = Updates.isEnabled;
  } catch {
    return;
  }

  if (!isEnabled) return;

  const updateTask = async () => {
    try {
      const checkResult = await Updates.checkForUpdateAsync();

      if (checkResult.isAvailable) {
        await Updates.fetchUpdateAsync();
      }
    } catch {
      // Falha de rede ou update incompatível: continua com bundle atual.
    }
  };

  const timeoutTask = new Promise<void>((resolve) => {
    setTimeout(resolve, UPDATE_TIMEOUT_MS);
  });

  await Promise.race([updateTask(), timeoutTask]);
}

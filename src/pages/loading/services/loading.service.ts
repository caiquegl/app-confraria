import { isAuthenticated } from "@/lib/auth";
import { checkAndDownloadUpdate } from "@/lib/updates";

export const LOADING_DURATION_MS = 2800;

export function waitDuration(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resolveInitialRoute(): Promise<"home" | "landing"> {
  const authenticated = await isAuthenticated();
  return authenticated ? "home" : "landing";
}

/**
 * Prepara o app na tela de loading (tudo em paralelo):
 * - Animação mínima (2,8s)
 * - Verificação OTA com timeout (sem reload na splash)
 * - Rota inicial (auth)
 */
export async function prepareApp(): Promise<"home" | "landing"> {
  const [route] = await Promise.all([
    resolveInitialRoute(),
    waitDuration(LOADING_DURATION_MS),
    checkAndDownloadUpdate(),
  ]);

  return route;
}

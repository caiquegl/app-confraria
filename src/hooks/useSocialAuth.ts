import { router } from "expo-router";
import { useCallback, useState } from "react";
import Toast from "react-native-toast-message";

import {
  SocialCancelledError,
  socialLogin,
  type SocialProvider,
} from "@/lib/social-auth";

// Codigos de cancelamento (Google/Apple/Facebook) como strings, para nao
// precisar importar o modulo nativo aqui (o import quebraria o app).
const CANCEL_CODES = new Set([
  "SIGN_IN_CANCELLED",
  "-5",
  "12501",
  "ERR_REQUEST_CANCELED",
  "ERR_CANCELED",
]);

function isCancellation(err: unknown): boolean {
  if (err instanceof SocialCancelledError) return true;
  const code = String((err as { code?: unknown })?.code ?? "");
  return CANCEL_CODES.has(code);
}

function getErrorMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    "Nao foi possivel entrar. Verifique se o app foi recompilado com os modulos nativos."
  );
}

export function useSocialAuth() {
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);

  const signIn = useCallback(
    async (provider: SocialProvider) => {
      if (pendingProvider) return;
      setPendingProvider(provider);
      try {
        const { isNewUser } = await socialLogin(provider);
        Toast.show({
          type: "success",
          text1: "Login realizado!",
          text2: "Bem-vindo a Confraria",
          visibilityTime: 3000,
        });
        router.replace("/feed");
        void isNewUser;
      } catch (err) {
        if (isCancellation(err)) return;
        Toast.show({
          type: "error",
          text1: "Erro no login social",
          text2: getErrorMessage(err),
          visibilityTime: 4000,
        });
      } finally {
        setPendingProvider(null);
      }
    },
    [pendingProvider],
  );

  return { pendingProvider, signIn };
}

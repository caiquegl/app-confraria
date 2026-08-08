import { api } from "./api";
import { apiRoutes } from "./api-routes";
import { saveToken } from "./auth";
import { socialAuthConfig } from "./social-auth-config";

export type SocialProvider = "google" | "facebook" | "apple";
export type SocialLoginResult = { isNewUser: boolean };

export class SocialCancelledError extends Error {
  constructor() {
    super("Login social cancelado");
    this.name = "SocialCancelledError";
  }
}

// IMPORTANTE: os modulos nativos sao carregados de forma preguicosa (require
// dentro da funcao) para nao quebrar o app no import quando o binario nativo
// ainda nao tem esses modulos (precisa de um novo development build).
let googleConfigured = false;

async function getGoogleIdToken(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleSignin } = require("@react-native-google-signin/google-signin");
  if (!googleConfigured) {
    GoogleSignin.configure({
      webClientId: socialAuthConfig.googleWebClientId,
      iosClientId: socialAuthConfig.googleIosClientId || undefined,
      offlineAccess: false,
    });
    googleConfigured = true;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken =
    (response as { data?: { idToken?: string | null } })?.data?.idToken ??
    (response as { idToken?: string | null })?.idToken ??
    null;
  if (!idToken) throw new Error("Google nao retornou o idToken");
  return idToken;
}

async function getFacebookAccessToken(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AccessToken, LoginManager } = require("react-native-fbsdk-next");
  const result = await LoginManager.logInWithPermissions(["public_profile", "email"]);
  if (result.isCancelled) throw new SocialCancelledError();
  const data = await AccessToken.getCurrentAccessToken();
  if (!data?.accessToken) throw new Error("Facebook nao retornou o access token");
  return data.accessToken;
}

async function getAppleIdToken(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AppleAuthentication = require("expo-apple-authentication");
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error("Apple nao retornou o identityToken");
  return credential.identityToken;
}

async function getProviderToken(provider: SocialProvider): Promise<string> {
  switch (provider) {
    case "google":
      return getGoogleIdToken();
    case "facebook":
      return getFacebookAccessToken();
    case "apple":
      return getAppleIdToken();
  }
}

export async function socialLogin(provider: SocialProvider): Promise<SocialLoginResult> {
  const token = await getProviderToken(provider);
  const { data } = await api.post<{ token: string; isNewUser: boolean }>(
    apiRoutes.auth.social,
    { provider, token },
  );
  await saveToken(data.token);
  return { isNewUser: data.isNewUser };
}

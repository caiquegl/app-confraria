import Constants from "expo-constants";

type SocialAuthExtra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
};

const extra =
  ((Constants.expoConfig?.extra ?? {}) as { socialAuth?: SocialAuthExtra })
    .socialAuth ?? {};

// ============================================================================
// FLAG DO BOTAO APPLE
// Troque para `true` quando tiver a key/config da Apple pronta.
// (O botao Apple so aparece em iOS, mesmo com o flag ligado — e limitacao da
//  Apple: Sign in with Apple nao existe em Android.)
// ============================================================================
const APPLE_ENABLED = true;

// Flag do botao Facebook. Troque para true quando tiver a chave da Meta.
const FACEBOOK_ENABLED = false;

export const socialAuthConfig = {
  // Preencha estes via app.json -> expo.extra.socialAuth quando tiver os Client IDs.
  googleWebClientId: extra.googleWebClientId ?? "",
  googleIosClientId: extra.googleIosClientId ?? "",
  appleEnabled: APPLE_ENABLED,
  facebookEnabled: FACEBOOK_ENABLED,
};

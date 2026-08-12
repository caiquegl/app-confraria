const appJson = require("./app.json");

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const sentryOrg = process.env.SENTRY_ORG ?? "confraria";
const sentryProject = process.env.SENTRY_PROJECT ?? "react-native";
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";

// Login social (lido do .env; ver .env.example).
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? "";
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? "";
const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN ?? "";

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      // Consumido em src/lib/social-auth-config.ts
      socialAuth: {
        googleWebClientId,
        googleIosClientId,
      },
    },
    plugins: [
      ...appJson.expo.plugins,
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: googleMapsApiKey,
          iosGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
      // Google Sign-In: só aplica quando houver o iOS URL scheme configurado.
      ...(googleIosUrlScheme
        ? [
            [
              "@react-native-google-signin/google-signin",
              { iosUrlScheme: googleIosUrlScheme },
            ],
          ]
        : []),
      // Facebook: só aplica quando houver App ID + Client Token.
      ...(facebookAppId && facebookClientToken
        ? [
            [
              "react-native-fbsdk-next",
              {
                appID: facebookAppId,
                clientToken: facebookClientToken,
                displayName: "Confraria",
                scheme: `fb${facebookAppId}`,
                isAutoInitEnabled: true,
              },
            ],
          ]
        : []),
      ...(sentryDsn
        ? [
            [
              "@sentry/react-native/expo",
              {
                organization: sentryOrg,
                project: sentryProject,
                url: "https://sentry.io/",
              },
            ],
          ]
        : []),
    ],
  },
};

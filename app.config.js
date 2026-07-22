const appJson = require("./app.json");

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const sentryOrg = process.env.SENTRY_ORG ?? "confraria";
const sentryProject = process.env.SENTRY_PROJECT ?? "react-native";
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [
      ...appJson.expo.plugins,
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: googleMapsApiKey,
          iosGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
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

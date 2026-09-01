import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import type { GeolocationStatus } from "@/lib/location";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type LocationGatePurpose = "events" | "routes" | "services";

type LocationGateProps = {
  canAskAgain: boolean;
  onRequestPermission: () => void;
  purpose?: LocationGatePurpose;
  status: GeolocationStatus;
};

const PURPOSE_COPY: Record<
  LocationGatePurpose,
  { deniedDescription: string; loadingDescription: string }
> = {
  events: {
    deniedDescription:
      "Para ver eventos perto de você, o Confraria precisa acessar sua localização enquanto usa o app.",
    loadingDescription: "Estamos identificando sua cidade para mostrar eventos na região.",
  },
  routes: {
    deniedDescription:
      "Para ver rotas perto de você, o Confraria precisa acessar sua localização enquanto usa o app.",
    loadingDescription: "Estamos identificando sua cidade para mostrar rotas na região.",
  },
  services: {
    deniedDescription:
      "Para mostrar serviços e locais perto de você, o Confraria precisa acessar sua localização enquanto usa o app.",
    loadingDescription: "Estamos identificando sua localização para mostrar locais na região.",
  },
};

export function LocationGate({
  canAskAgain,
  onRequestPermission,
  purpose = "events",
  status,
}: LocationGateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isLoading = status === "idle" || status === "loading";
  const isDenied = status === "denied";
  const isError = status === "error";
  const copy = PURPOSE_COPY[purpose];

  const title = isDenied
    ? "Localização necessária"
    : isError
      ? "Não foi possível obter sua localização"
      : "Carregando localização";

  const description = isDenied
    ? copy.deniedDescription
    : isError
      ? "Verifique se o GPS está ativo e tente novamente."
      : copy.loadingDescription;

  return (
    <View style={[styles.screen, { paddingTop: 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        ) : (
          <View style={styles.iconWrap}>
            <Ionicons color={colors.brandDark} name="location-outline" size={48} />
          </View>
        )}

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {!isLoading ? (
          <Button
            size="lg"
            style={styles.button}
            onPress={() => {
              if (isDenied && !canAskAgain) {
                void Linking.openSettings();
                return;
              }

              onRequestPermission();
            }}
          >
            {isDenied && !canAskAgain ? "Abrir configurações" : "Permitir localização"}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  button: {
    marginTop: 24,
    minWidth: 220,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
    paddingHorizontal: 24,
  },
  description: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 24,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  screen: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 20,
    textAlign: "center",
  },
});

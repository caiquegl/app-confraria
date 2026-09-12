import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type RouteBackgroundPermissionModalProps = {
  onClose?: () => void;
  onContinueForeground: () => void;
  onPermissionGranted: () => void;
  routeTitle?: string;
  visible: boolean;
};

export function RouteBackgroundPermissionModal({
  onClose,
  onContinueForeground,
  onPermissionGranted,
  routeTitle,
  visible,
}: RouteBackgroundPermissionModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  const [permission, setPermission] = useState<Location.PermissionResponse | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;

    const checkPermissionStatus = async () => {
      try {
        const current = await Location.getBackgroundPermissionsAsync();
        if (!isMounted) return;
        setPermission(current);

        if (current.granted) {
          onPermissionGranted();
        }
      } catch {
        // Ignora erros transitórios na leitura de permissão
      }
    };

    void checkPermissionStatus();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void checkPermissionStatus();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [visible, onPermissionGranted]);

  const handleActionPress = async () => {
    setIsRequesting(true);
    try {
      const current = await Location.getBackgroundPermissionsAsync();
      setPermission(current);

      if (current.granted) {
        onPermissionGranted();
        return;
      }

      if (current.canAskAgain) {
        const requested = await Location.requestBackgroundPermissionsAsync();
        setPermission(requested);

        if (requested.granted) {
          onPermissionGranted();
          return;
        }

        // Se negou ou o sistema não permite mais perguntar diretamente
        if (!requested.canAskAgain) {
          void Linking.openSettings();
        }
      } else {
        void Linking.openSettings();
      }
    } catch {
      void Linking.openSettings();
    } finally {
      setIsRequesting(false);
    }
  };

  const isIos = Platform.OS === "ios";
  const canDirectlyAsk = permission ? permission.canAskAgain : true;
  const buttonLabel = isRequesting
    ? "Verificando..."
    : canDirectlyAsk
      ? "Ativar rastreamento em segundo plano"
      : isIos
        ? "Abrir Ajustes do iPhone"
        : "Abrir Configurações do aparelho";

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose ?? onContinueForeground}
    >
      <View style={styles.backdropWrap}>
        <Pressable
          accessibilityLabel="Fechar modal de permissão"
          accessibilityRole="button"
          style={styles.backdrop}
          onPress={onClose ?? onContinueForeground}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <Ionicons color={colors.brandDark} name="navigate-circle" size={36} />
          </View>

          <Text style={styles.title}>Rastreamento em segundo plano</Text>

          {routeTitle ? (
            <Text numberOfLines={1} style={styles.routeBadge}>
              {routeTitle}
            </Text>
          ) : null}

          <Text style={styles.description}>
            Para registrar sua quilometragem, velocidade e rota mesmo com o celular no bolso ou a tela
            bloqueada, precisamos da sua permissão de localização.
          </Text>

          <View style={styles.tipCard}>
            <Ionicons color={colors.brandDark} name="information-circle-outline" size={20} />
            <View style={styles.tipTextWrap}>
              <Text style={styles.tipTitle}>
                {isIos ? "Dica para iPhone" : "Dica para Android"}
              </Text>
              <Text style={styles.tipBody}>
                {isIos
                  ? "Nos Ajustes, toque em Localização e selecione a opção \"Sempre\"."
                  : "Nas Configurações do app, toque em Permissões > Localização e escolha \"Permitir o tempo todo\"."}
              </Text>
            </View>
          </View>

          <Button
            disabled={isRequesting}
            size="lg"
            style={styles.primaryButton}
            onPress={handleActionPress}
          >
            {isRequesting ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              buttonLabel
            )}
          </Button>

          <Pressable
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={onContinueForeground}
          >
            <Text style={styles.secondaryButtonText}>Continuar sem segundo plano</Text>
            <Text style={styles.secondaryButtonHint}>
              Navegar normalmente com o app aberto na tela
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => ({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay.scrimMedium,
  },
  backdropWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  description: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border.subtle,
    borderRadius: 999,
    height: 4,
    marginBottom: 20,
    width: 40,
  },
  iconWrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    marginBottom: 16,
    width: 64,
  },
  primaryButton: {
    marginTop: 20,
    width: "100%",
  },
  routeBadge: {
    alignSelf: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 8,
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  secondaryButton: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  secondaryButtonHint: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  secondaryButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  tipBody: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  tipCard: {
    alignItems: "flex-start",
    backgroundColor: colors.surface.subtle,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    padding: 14,
    width: "100%",
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: colors.brandDark,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
});

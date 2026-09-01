import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type QuickRideEditUnavailableModalProps = {
  message: string;
  onClose: () => void;
  title: string;
  visible: boolean;
};

export function QuickRideEditUnavailableModal({
  message,
  onClose,
  title,
  visible,
}: QuickRideEditUnavailableModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdropWrap}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.iconWrap}>
            <Ionicons color={colors.brandDark} name="information-circle-outline" size={28} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button size="lg" style={styles.button} onPress={onClose}>
            Entendi
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => ({
  backdrop: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  backdropWrap: {
    backgroundColor: colors.overlay.scrim,
    flex: 1,
    justifyContent: "flex-end",
  },
  button: {
    width: "100%",
  },
  iconWrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginBottom: 16,
    width: 56,
  },
  message: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: "100%",
  },
  title: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
});

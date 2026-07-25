import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

export type RouteNavigationMediaAction = "story" | "feed" | "map_pin";

type RouteNavigationMediaSheetProps = {
  onClose: () => void;
  onSelect: (action: RouteNavigationMediaAction) => void;
  visible: boolean;
};

export function RouteNavigationMediaSheet({
  onClose,
  onSelect,
  visible,
}: RouteNavigationMediaSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Registrar momento</Text>
          <Text style={styles.subtitle}>Escolha como compartilhar durante o passeio</Text>

          <Pressable
            accessibilityRole="button"
            style={styles.optionButton}
            onPress={() => onSelect("story")}
          >
            <View style={[styles.iconWrap, styles.storyIconWrap]}>
              <Ionicons color={colors.brandPrimary} name="sparkles-outline" size={18} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Criar story</Text>
              <Text style={styles.optionDescription}>
                Publica no seu story, como no feed da Confraria
              </Text>
            </View>
            <Ionicons color="#9CA3AF" name="chevron-forward" size={18} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.optionButton}
            onPress={() => onSelect("feed")}
          >
            <View style={[styles.iconWrap, styles.feedIconWrap]}>
              <Ionicons color={colors.brandDark} name="images-outline" size={18} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Criar no feed</Text>
              <Text style={styles.optionDescription}>
                Monta um post com foto ou vídeo no seu feed
              </Text>
            </View>
            <Ionicons color="#9CA3AF" name="chevron-forward" size={18} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.optionButton}
            onPress={() => onSelect("map_pin")}
          >
            <View style={[styles.iconWrap, styles.mapIconWrap]}>
              <Ionicons color="#FFFFFF" name="location-outline" size={18} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Marcar no mapa</Text>
              <Text style={styles.optionDescription}>
                Salva um ponto neste trajeto
              </Text>
            </View>
            <Ionicons color="#9CA3AF" name="chevron-forward" size={18} />
          </Pressable>

          <Pressable
            accessibilityLabel="Fechar"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons color="#9CA3AF" name="close" size={20} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "flex-end",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 12,
  },
  feedIconWrap: {
    backgroundColor: "#F3F4F6",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  mapIconWrap: {
    backgroundColor: colors.brandDark,
  },
  optionButton: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionDescription: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  optionTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "700",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  storyIconWrap: {
    backgroundColor: "#F0F7D8",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 12,
  },
  title: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
});

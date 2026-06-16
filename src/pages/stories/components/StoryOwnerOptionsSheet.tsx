import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StoryOwnerOptionsSheetProps = {
  visible: boolean;
  onCancel: () => void;
  onDelete: () => void;
};

export function StoryOwnerOptionsSheet({
  visible,
  onCancel,
  onDelete,
}: StoryOwnerOptionsSheetProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Pressable accessibilityLabel="Fechar opções" style={styles.backdrop} onPress={onCancel} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.card}>
          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteText}>Apagar story</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.4)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  cancelText: {
    color: "#1F2937",
    fontSize: 17,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  container: {
    bottom: 0,
    justifyContent: "flex-end",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  deleteText: {
    color: "#EF4444",
    fontSize: 17,
    fontWeight: "600",
  },
  sheet: {
    gap: 8,
    paddingHorizontal: 12,
    position: "relative",
  },
});

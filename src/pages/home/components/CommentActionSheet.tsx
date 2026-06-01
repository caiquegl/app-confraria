import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type CommentActionSheetProps = {
  confirmDelete: boolean;
  visible: boolean;
  onCancel: () => void;
  onConfirmDelete: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
};

export function CommentActionSheet({
  confirmDelete,
  visible,
  onCancel,
  onConfirmDelete,
  onEdit,
  onRequestDelete,
}: CommentActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          {confirmDelete ? (
            <View style={styles.confirmBlock}>
              <Text style={styles.confirmTitle}>Excluir comentário?</Text>
              <Text style={styles.confirmText}>Esta ação não pode ser desfeita.</Text>

              <Pressable style={styles.deleteButton} onPress={onConfirmDelete}>
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionsBlock}>
              <Pressable style={styles.actionRow} onPress={onEdit}>
                <Ionicons color="#6B7280" name="pencil" size={18} />
                <Text style={styles.actionLabel}>Editar</Text>
              </Pressable>

              <Pressable style={styles.actionRowDanger} onPress={onRequestDelete}>
                <Ionicons color="#EF4444" name="trash-outline" size={18} />
                <Text style={styles.actionLabelDanger}>Excluir</Text>
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "600",
  },
  actionLabelDanger: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  actionRow: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  actionRowDanger: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  actionsBlock: {
    gap: 4,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    marginTop: 8,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmBlock: {
    gap: 12,
  },
  confirmText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  confirmTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 16,
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { ShareFriendItem } from "@/pages/home/components/ShareFriendItem";
import type { ShareSendResult } from "@/pages/home/components/SharePostSheet";
import type { FeedShareFriend } from "@/pages/home/types/feed.types";
import { colors } from "@/theme/colors";

type RouteSharePreview = {
  destinationLabel: string;
  originLabel: string;
  title: string;
};

type RouteShareSheetProps = {
  friends: FeedShareFriend[];
  mode?: "invite" | "share";
  onClose: () => void;
  onSendToFriend: (friendId: string) => Promise<ShareSendResult | null>;
  onSent?: (result: ShareSendResult) => void;
  route: RouteSharePreview | null;
  sentFriendId: string | null;
};

export function RouteShareSheet({
  friends,
  mode = "share",
  onClose,
  onSendToFriend,
  onSent,
  route,
  sentFriendId,
}: RouteShareSheetProps) {
  const insets = useSafeAreaInsets();

  if (!route) return null;

  const isInvite = mode === "invite";

  const handleSend = async (friendId: string) => {
    try {
      const result = await onSendToFriend(friendId);
      Toast.show({
        type: "success",
        text1: isInvite ? "Convite enviado" : "Rota enviada",
        text2: isInvite
          ? "Seu parceiro receberá o convite no chat."
          : "Compartilhada por mensagem.",
        visibilityTime: 1800,
      });
      if (result) {
        onSent?.(result);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao compartilhar",
        text2: "Não foi possível enviar essa rota por mensagem.",
      });
    }
  };

  return (
    <Modal animationType="fade" transparent statusBarTranslucent visible={!!route}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {isInvite ? "Convidar para o passeio" : "Compartilhar com quem sigo"}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {route.title}
            </Text>
          </View>

          <Pressable style={styles.closeButton} hitSlop={8} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <View style={styles.preview}>
          <View style={styles.previewFallback}>
            <Ionicons name="map-outline" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.previewText}>
            <Text style={styles.previewName} numberOfLines={1}>
              {route.originLabel} → {route.destinationLabel}
            </Text>
            <Text style={styles.previewContext} numberOfLines={1}>
              {route.title}
            </Text>
          </View>
          <Ionicons name="send-outline" size={18} color={colors.brandPrimary} />
        </View>

        <View style={styles.friends}>
          {friends.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Você ainda não segue ninguém para compartilhar.
              </Text>
            </View>
          ) : (
            friends.map((friend) => (
              <ShareFriendItem
                key={friend.id}
                friend={friend}
                isSent={sentFriendId === friend.id}
                onSend={handleSend}
              />
            ))
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  empty: {
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
  },
  friends: {
    gap: 12,
    marginTop: 16,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
  },
  preview: {
    alignItems: "center",
    backgroundColor: "#F7F8F4",
    borderColor: "#E8EBE3",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewContext: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  previewFallback: {
    alignItems: "center",
    backgroundColor: "#EEF3E2",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  previewName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  previewText: {
    flex: 1,
    minWidth: 0,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 18,
    position: "absolute",
    right: 0,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  title: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
  },
});

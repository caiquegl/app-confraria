import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { ShareFriendItem } from "@/pages/home/components/ShareFriendItem";
import type { ShareSendResult } from "@/pages/home/components/SharePostSheet";
import type { FeedShareFriend } from "@/pages/home/types/feed.types";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventSharePreview = {
  category: string;
  coverImageUrl: string | null;
  organizerName: string;
  title: string;
};

type EventShareSheetProps = {
  event: EventSharePreview | null;
  friends: FeedShareFriend[];
  onClose: () => void;
  onSent?: (result: ShareSendResult) => void;
  onSendToFriend: (friendId: string) => Promise<ShareSendResult | null>;
  sentFriendId: string | null;
};

export function EventShareSheet({
  event,
  friends,
  onClose,
  onSent,
  onSendToFriend,
  sentFriendId,
}: EventShareSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  if (!event) return null;

  const handleSend = async (friendId: string) => {
    try {
      const result = await onSendToFriend(friendId);
      Toast.show({
        type: "success",
        text1: "Evento enviado",
        text2: "Compartilhado por mensagem.",
        visibilityTime: 1800,
      });
      if (result) {
        onSent?.(result);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao compartilhar",
        text2: "Não foi possível enviar esse evento por mensagem.",
      });
    }
  };

  return (
    <Modal animationType="fade" transparent statusBarTranslucent visible={!!event}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Compartilhar com quem sigo</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {event.title}
            </Text>
          </View>

          <Pressable style={styles.closeButton} hitSlop={8} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        <View style={styles.preview}>
          {event.coverImageUrl ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              recyclingKey={event.coverImageUrl}
              source={{ uri: event.coverImageUrl }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.previewFallback}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.muted} />
            </View>
          )}
          <View style={styles.previewText}>
            <Text style={styles.previewName} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={styles.previewContext} numberOfLines={1}>
              {event.category} · {event.organizerName}
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

const createStyles = (colors: AppColors) => ({
  backdrop: {
    backgroundColor: colors.overlay.scrimMedium,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: "center",
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  empty: {
    borderColor: colors.border.subtle,
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: {
    color: colors.text.muted,
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
    backgroundColor: colors.surface.preview,
    borderColor: colors.border.brandLight,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewContext: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  previewFallback: {
    alignItems: "center",
    backgroundColor: colors.surface.brandSubtle,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  previewImage: {
    borderRadius: 14,
    height: 44,
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
    backgroundColor: colors.surface.primary,
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
    color: colors.text.secondary,
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

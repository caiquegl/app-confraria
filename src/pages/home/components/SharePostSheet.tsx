import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

import type { FeedPost, FeedShareFriend } from "../types/feed.types";
import { ShareFriendItem } from "./ShareFriendItem";

type SharePostSheetProps = {
  friends: FeedShareFriend[];
  onClose: () => void;
  onSendToFriend: (friendId: string) => void;
  post: FeedPost | null;
  sentFriendId: string | null;
};

export function SharePostSheet({
  friends,
  onClose,
  onSendToFriend,
  post,
  sentFriendId,
}: SharePostSheetProps) {
  const insets = useSafeAreaInsets();

  if (!post) return null;

  const title = post.caption || post.eventTitle || post.routeTitle || "Post da Confraria";
  const context = post.eventTitle || post.routeTitle || "Post da confraria";

  const handleSend = (friendId: string) => {
    onSendToFriend(friendId);
    Toast.show({
      type: "success",
      text1: "Post enviado",
      text2: "Compartilhado com seu amigo.",
      visibilityTime: 1800,
    });
  };

  return (
    <Modal animationType="fade" transparent statusBarTranslucent visible={!!post}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Compartilhar com amigos</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {title}
            </Text>
          </View>

          <Pressable style={styles.closeButton} hitSlop={8} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <View style={styles.preview}>
          <UserAvatar avatarUrl={post.userAvatar} name={post.userName} size={40} />
          <View style={styles.previewText}>
            <Text style={styles.previewName} numberOfLines={1}>
              {post.userName}
            </Text>
            <Text style={styles.previewContext} numberOfLines={1}>
              {context}
            </Text>
          </View>
          <Ionicons name="send-outline" size={18} color={colors.brandPrimary} />
        </View>

        <View style={styles.friends}>
          {friends.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum amigo disponível para compartilhar agora.</Text>
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
  nativeButton: {
    marginTop: 16,
    width: "100%",
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

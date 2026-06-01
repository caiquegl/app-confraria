import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/components/UserAvatar";
import { formatRelativeTime } from "@/pages/home/services/feed.service";
import { colors } from "@/theme/colors";

import type { StoryItem, StoryViewerUser } from "../types/stories.types";

type StoryViewersSheetProps = {
  isLoading: boolean;
  story: StoryItem | null;
  viewers: StoryViewerUser[];
  onClose: () => void;
};

export function StoryViewersSheet({
  isLoading,
  story,
  viewers,
  onClose,
}: StoryViewersSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={Boolean(story)}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Visualizações e curtidas</Text>
            <Text style={styles.subtitle}>
              {story?.viewerCount ?? 0} visualizações • {story?.likeCount ?? 0} curtidas
            </Text>
          </View>
          <Pressable hitSlop={8} onPress={onClose}>
            <Ionicons color="#6B7280" name="close" size={22} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brandPrimary} />
          </View>
        ) : (
          <FlatList
            data={viewers}
            keyExtractor={(viewer) => viewer.userId}
            contentContainerStyle={viewers.length === 0 && styles.emptyContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons color="#D1D5DB" name="eye-outline" size={34} />
                <Text style={styles.emptyText}>Ninguém viu este story ainda.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.viewerRow}>
                <UserAvatar
                  avatarUrl={item.userAvatar}
                  name={item.userName}
                  size={38}
                />
                <View style={styles.viewerInfo}>
                  <Text numberOfLines={1} style={styles.viewerName}>
                    {item.userName}
                  </Text>
                  <Text style={styles.viewerTime}>
                    {formatRelativeTime(item.viewedAt)}
                  </Text>
                </View>
                {item.liked && (
                  <View style={styles.likeBadge}>
                    <Ionicons color="#EF4444" name="heart" size={16} />
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  empty: {
    alignItems: "center",
    gap: 8,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#D1D5DB",
    borderRadius: 999,
    height: 4,
    marginBottom: 14,
    width: 42,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  loading: {
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  likeBadge: {
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    left: 0,
    maxHeight: "62%",
    paddingHorizontal: 18,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
  viewerInfo: {
    flex: 1,
    minWidth: 0,
  },
  viewerName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  viewerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
  },
  viewerTime: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
});
